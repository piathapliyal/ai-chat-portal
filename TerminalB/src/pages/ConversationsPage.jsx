import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listConversations } from "../api/conversations.js";

const fmt = (v) => (v ? new Date(v).toLocaleString() : "—");

export default function ConversationsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await listConversations();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Could not load conversations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.summary || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <div className="text-xs text-gray-500">
          API: {import.meta.env.VITE_API_BASE || "(unset)"}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Search by title or summary…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        ) : null}
      </div>

      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border px-4 py-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border px-4 py-10 text-center text-sm text-gray-500">
          No conversations yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-white/70 overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium text-gray-500">
            <div className="col-span-6">Title</div>
            <div className="col-span-3">Created</div>
            <div className="col-span-3">Status</div>
          </div>
          <div className="divide-y">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/conversations/${c.id}`)}
                className="grid w-full grid-cols-12 gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="col-span-6">
                  <div className="font-medium">{c.title || "Untitled"}</div>
                  {c.summary ? (
                    <div className="line-clamp-1 text-xs text-gray-500">{c.summary}</div>
                  ) : null}
                </div>
                <div className="col-span-3 text-sm text-gray-600">{fmt(c.created_at)}</div>
                <div className="col-span-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-1 text-xs",
                      c.ended_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700",
                    ].join(" ")}
                  >
                    {c.ended_at ? "Ended" : "Active"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
