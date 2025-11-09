from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, QueryPastConversations

router = DefaultRouter()
router.register(r"conversations", ConversationViewSet, basename="conversation")

urlpatterns = [
    path("", include(router.urls)),
    path("query/", QueryPastConversations.as_view(), name="query"),
]
