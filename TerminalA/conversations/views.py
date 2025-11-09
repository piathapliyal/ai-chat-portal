from django.utils import timezone
from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    SendMessageSerializer,
    QuerySerializer,
)

# Add output serializers for query results
from rest_framework import serializers


class QueryMatchOutSerializer(serializers.Serializer):
    conversation_id = serializers.CharField()
    message_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    snippet = serializers.CharField()
    timestamp = serializers.DateTimeField(required=False, allow_null=True)
    score = serializers.FloatField()


class QueryOutSerializer(serializers.Serializer):
    answer = serializers.CharField()
    excerpts = QueryMatchOutSerializer(many=True)


# AI + semantic search (optional local LLM)
from .ai import summarize_and_tag, gemini_chat
from .services import messages_to_llm_format


class ConversationViewSet(viewsets.ModelViewSet):
    """
    /api/conversations/              GET list, POST create
    /api/conversations/{id}/         GET retrieve
    /api/conversations/{id}/messages/  POST user message + AI reply
    /api/conversations/{id}/end/       POST finalize conversation + summary
    """
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Conversation.objects
            .all()
            .order_by("-started_at")
            .prefetch_related(
                Prefetch("messages", queryset=Message.objects.order_by("created_at"))
            )
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ConversationListSerializer
        if self.action == "retrieve":
            return ConversationDetailSerializer
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationDetailSerializer

    def create(self, request, *args, **kwargs):
        ser = ConversationCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        conv = ser.save()
        return Response(ConversationDetailSerializer(conv).data, status=201)

    @action(detail=True, methods=["post"], url_path="messages")
    def send_message(self, request, pk=None):
        conv = self.get_object()
        if conv.status != "active":
            return Response({"detail": "Conversation has ended."}, status=400)

        msg_ser = SendMessageSerializer(data=request.data)
        msg_ser.is_valid(raise_exception=True)

        user_msg = Message.objects.create(
            conversation=conv,
            role=msg_ser.validated_data["role"],
            content=msg_ser.validated_data["content"],
        )

        ai_msg = None
        if user_msg.role == "user":
            messages = [{"role": "system", "content": "You are a concise, helpful assistant."}]
            messages += messages_to_llm_format(conv)
            ai_text = gemini_chat(messages) or "..."
            ai_msg = Message.objects.create(conversation=conv, role="assistant", content=ai_text)

        return Response(
            {
                "user_message": MessageSerializer(user_msg).data,
                "assistant_message": MessageSerializer(ai_msg).data if ai_msg else None,
            },
            status=201,
        )

    @action(detail=True, methods=["post"], url_path="end")
    def end_conversation(self, request, pk=None):
        conv = self.get_object()
        if conv.status == "ended":
            return Response({"detail": "Already ended."}, status=400)

        text_dump = "\n".join(
            f"{m.role}: {m.content}" for m in conv.messages.order_by("created_at")
        )

        summary, tags = summarize_and_tag(text_dump)
        conv.summary = summary
        conv.tags = tags
        conv.status = "ended"
        conv.ended_at = timezone.now()
        conv.save()

        return Response(ConversationDetailSerializer(conv).data, status=200)


# -----------------------------------------------------------
# Conversation Intelligence Query (Simple Keyword Search)
# -----------------------------------------------------------

def _score(text, terms):
    t = (text or "").lower()
    return sum(t.count(term) for term in terms if term)


def _snippet(text, term, pad=80):
    t = text or ""
    i = t.lower().find(term.lower())
    if i < 0:
        return (t[: pad * 2] + "…") if len(t) > pad * 2 else t
    a = max(0, i - pad)
    b = min(len(t), i + len(term) + pad)
    return ("…" if a else "") + t[a:b] + ("…" if b < len(t) else "")


@extend_schema(request=QuerySerializer, responses=QueryOutSerializer)
class QueryPastConversations(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = QuerySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        q = ser.validated_data["query"].strip()

        if not q:
            return Response({"answer": "Please type something to search.", "excerpts": []})

        terms = [w for w in q.lower().split() if w]

        results = []
        convs = (
            Conversation.objects
            .prefetch_related(Prefetch("messages", queryset=Message.objects.order_by("created_at")))
            .order_by("-started_at")
        )

        for c in convs:
            base = _score(f"{c.title or ''} {c.summary or ''}", terms)
            for m in c.messages.all():
                sc = base + _score(m.content, terms)
                if sc > 0:
                    results.append({
                        "conversation_id": str(c.id),
                        "message_id": str(m.id),
                        "snippet": _snippet(m.content, terms[0]),
                        "timestamp": m.created_at,
                        "score": sc,
                    })

        results.sort(key=lambda x: -x["score"])
        top = results[:10]

        if not top:
            return Response({"answer": "No relevant results found.", "excerpts": []})

        return Response({
            "answer": f"Found {len(top)} relevant excerpts.",
            "excerpts": top,
        })
