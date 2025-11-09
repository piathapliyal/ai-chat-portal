import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ChatPage from "./pages/ChatPage"; // your existing chat page
import ConversationsPage from "./pages/ConversationsPage";
import ConversationDetailPage from "./pages/ConversationDetailPage";
import IntelligencePage from "./pages/IntelligencePage"



export default function App() {
  return (
    <BrowserRouter>
      <header className="border-b bg-white/60 backdrop-blur">
        <nav className="mx-auto max-w-6xl flex gap-6 p-3">
          <Link to="/chat">Chat</Link>
          <Link to="/conversations">Conversations</Link>
          <Link to="/intelligence">Intelligence</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/conversations/:id" element={<ConversationDetailPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
