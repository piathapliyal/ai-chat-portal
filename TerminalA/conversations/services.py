from typing import List, Tuple
from .models import Conversation, Message, MessageEmbedding
from .ai import gemini_chat, gemini_embed, cosine

def messages_to_llm_format(conv: Conversation) -> List[dict]:
    return [{"role": m.role, "content": m.content} for m in conv.messages.order_by("created_at")]

def ensure_embeddings_for_ended_conversations() -> None:
    embedded_ids = set(MessageEmbedding.objects.values_list("message_id", flat=True))
    to_embed = (Message.objects.select_related("conversation")
                .filter(conversation__status="ended")
                .exclude(id__in=embedded_ids)
                .order_by("id"))
    if not to_embed:
        return
    vecs = gemini_embed([m.content for m in to_embed])
    for m, v in zip(to_embed, vecs):
        MessageEmbedding.objects.create(message=m, vector=v)

def semantic_search(query: str, k: int = 8) -> List[Tuple[float, MessageEmbedding]]:
    qv = gemini_embed(query)[0]
    hits: List[Tuple[float, MessageEmbedding]] = []
    for me in MessageEmbedding.objects.select_related("message","message__conversation"):
        if me.message.conversation.status != "ended":
            continue
        hits.append((cosine(qv, me.vector), me))
    hits.sort(key=lambda x: x[0], reverse=True)
    return hits[:k]

def build_context_snippets(top_hits: List[Tuple[float, MessageEmbedding]]) -> tuple[str, list]:
    lines, excerpts = [], []
    for score, me in top_hits:
        m = me.message
        snippet = m.content[:350] + ("..." if len(m.content) > 350 else "")
        lines.append(f"[C{m.conversation_id}] {snippet}")
        excerpts.append({"conversation_id": m.conversation_id, "created_at": m.created_at,
                         "snippet": snippet, "score": round(score, 4)})
    return "\n\n".join(lines), excerpts

def answer_over_context(user_query: str, context_text: str) -> str:
    prompt = [
        {"role":"system","content":"You are a precise conversation analyst. Cite conversation IDs like [C123]."},
        {"role":"user","content":f"Context:\n{context_text}\n\nQuestion: {user_query}\n\nAnswer using only the context. If uncertain, say so."}
    ]
    return gemini_chat(prompt)
