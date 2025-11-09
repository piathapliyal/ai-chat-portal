import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export default function ChatPage() {
  const [conv, setConv] = useState(null);      // { id, status, messages, ... }
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);

  // start a fresh conversation once
  useEffect(() => {
    startNew();
  }, []);

  // keep the view scrolled to latest message
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conv]);

  async function startNew() {
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/conversations/`, { title: "" });
      setConv(data);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Couldn't start a new conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    if (!conv || !text.trim() || busy) return;

    const content = text.trim();
    setText("");
    setBusy(true);

    try {
      const { data } = await axios.post(
        `${API}/conversations/${conv.id}/messages/`,
        { role: "user", content }
      );

      // append both user + assistant messages if present
      setConv((prev) => ({
        ...prev,
        messages: [
          ...(prev?.messages || []),
          data.user_message,
          data.assistant_message,
        ].filter(Boolean),
      }));
    } catch (err) {
      console.error(err);
      alert("Message failed. Check backend.");
    } finally {
      setBusy(false);
    }
  }

  async function finishChat() {
    if (!conv || busy || conv.status === "ended") return;
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/conversations/${conv.id}/end/`);
      setConv(data); // now includes summary + tags
    } catch (err) {
      console.error(err);
      alert("Couldn't end conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Chat</div>
          <div className="text-xs text-gray-500">
            {conv ? `Conversation #${conv.id} • ${conv.status}` : "Starting…"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNew}
            className="px-3 py-2 rounded border bg-white"
            disabled={busy}
          >
            New
          </button>
          <button
            onClick={finishChat}
            disabled={busy || !conv || conv.status === "ended"}
            className="px-3 py-2 rounded bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-50"
            title="End this chat and generate a summary"
          >
            Finish Chat
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="border rounded-2xl bg-white p-4 h-[62vh] overflow-y-auto"
      >
        {!conv?.messages?.length && (
          <div className="text-sm text-gray-500">Say hi to start…</div>
        )}

        {(conv?.messages || []).map((m) => {
          const mine = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"} mb-3`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-3 ${
                  mine
                    ? "bg-black text-white rounded-br-sm"
                    : "bg-gray-50 border rounded-bl-sm"
                }`}
              >
                <div className="text-[11px] opacity-70 mb-1">
                  {mine ? "You" : "Assistant"} •{" "}
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
                {m.content}
              </div>
            </div>
          );
        })}

        {conv?.status === "ended" && (
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-semibold mb-2">Summary</div>
            <pre className="whitespace-pre-wrap text-sm">{conv.summary}</pre>
            {!!(conv.tags || []).length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {conv.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder={
            conv?.status === "ended"
              ? "This conversation is ended. Click New to start again."
              : "Type and press Enter…"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={!conv || conv.status === "ended" || busy}
        />
        <button
          onClick={sendMessage}
          disabled={!conv || conv.status === "ended" || busy}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
