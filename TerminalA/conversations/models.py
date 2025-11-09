from django.db import models


class Conversation(models.Model):
    """
    A chat session. Starts 'active', becomes 'ended' when summarized.
    """
    title = models.CharField(max_length=160, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, default="active")  # active | ended
    summary = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)           # ["travel", "budget"]
    meta = models.JSONField(default=dict, blank=True)           # freeform extra info

    def __str__(self) -> str:
        return f"{self.id} • {self.title or 'Untitled'}"


class Message(models.Model):
    """
    One message inside a conversation, either by the user or the assistant.
    """
    ROLE_CHOICES = (("user", "user"), ("assistant", "assistant"))

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class MessageEmbedding(models.Model):
    """
    Embedding vector for a message (for semantic search). Stored as JSON list[float].
    """
    message = models.OneToOneField(
        Message, on_delete=models.CASCADE, related_name="embedding"
    )
    vector = models.JSONField()  # [0.123, -0.045, ...]
    created_at = models.DateTimeField(auto_now_add=True)
