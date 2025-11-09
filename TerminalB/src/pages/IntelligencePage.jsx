import { useState } from "react";

const API = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

export default function IntelligencePage() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function ask() {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`${API}/query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setResult(await r.json());
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Conversation Intelligence</h1>

      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Ask about your past conversations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
          onClick={ask}
          disabled={busy || !q.trim()}
        >
          {busy ? "Searching…" : "Ask"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white/70 p-4">
            <div className="text-sm font-medium">Answer</div>
            <p className="mt-1 whitespace-pre-wrap">{result.answer || "—"}</p>
          </div>

          {Array.isArray(result.matches) && result.matches.length > 0 && (
            <div className="rounded-xl border divide-y">
              {result.matches.map((m, i) => (
                <div key={`${m.conversation_id}-${m.message_id || i}`} className="p-3">
                  <div className="text-xs text-gray-500">
                    Conversation #{m.conversation_id}
                    {m.timestamp ? ` • ${new Date(m.timestamp).toLocaleString()}` : ""}
                    {typeof m.score === "number" ? ` • score ${m.score.toFixed(2)}` : ""}
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{m.snippet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
