import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getConversation } from "../api/conversations";

const fmt = (v) => (v ? new Date(v).toLocaleString() : "—");

export default function ConversationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const convo = await getConversation(id);
        if (!cancelled) setData(convo);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Could not load conversation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (err) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link to="/conversations" className="underline text-sm">Back</Link>
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return <div className="mx-auto max-w-4xl text-gray-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">{data.title || "Conversation"}</h1>
        <Link to="/conversations" className="underline text-sm">Back to list</Link>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <div>Created: {fmt(data.created_at)}</div>
        <div>Status: {data.ended_at ? "Ended" : "Active"}</div>
      </div>

      {data.summary ? (
        <div className="rounded-xl border bg-white/70 p-4">
          <div className="text-sm font-medium">AI Summary</div>
          <p className="mt-1 text-sm text-gray-700">{data.summary}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {data.messages?.length ? (
          data.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-50" : "bg-gray-50"}`}
            >
              <div className="text-xs text-gray-500">
                {m.role} • {fmt(m.timestamp)}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border px-4 py-10 text-center text-sm text-gray-500">
            No messages in this conversation.
          </div>
        )}
      </div>
    </div>
  );
}
