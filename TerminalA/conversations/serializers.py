from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "title", "started_at", "ended_at", "status", "tags"]


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "started_at",
            "ended_at",
            "status",
            "summary",
            "tags",
            "messages",
        ]


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["title"]


class SendMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"], default="user")
    content = serializers.CharField()


class QuerySerializer(serializers.Serializer):
    query = serializers.CharField()
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    topics = serializers.ListField(child=serializers.CharField(), required=False)
    keywords = serializers.ListField(child=serializers.CharField(), required=False)
    analysis_depth = serializers.ChoiceField(
        choices=["light", "normal", "deep"], required=False, default="normal"
    )
class QueryRequestSerializer(serializers.Serializer):
    query = serializers.CharField()

class QueryMatchSerializer(serializers.Serializer):
    conversation_id = serializers.CharField()
    message_id = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    snippet = serializers.CharField()
    timestamp = serializers.DateTimeField(allow_null=True, required=False)
    score = serializers.FloatField()

class QueryResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    matches = QueryMatchSerializer(many=True)

 

class QueryMatchOutSerializer(serializers.Serializer):
    conversation_id = serializers.CharField()
    message_id = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    snippet = serializers.CharField()
    timestamp = serializers.DateTimeField(allow_null=True, required=False)
    score = serializers.FloatField()

class QueryOutSerializer(serializers.Serializer):
    answer = serializers.CharField()
    excerpts = QueryMatchOutSerializer(many=True)
   