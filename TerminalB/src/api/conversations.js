
const API = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

const withSlash = (path) => {
  const p = path.replace(/^\/+/, "");
  return `${API}/${p}${p.endsWith("/") ? "" : "/"}`;
};

export async function listConversations() {
  const res = await fetch(withSlash("conversations"));
  if (!res.ok) throw new Error(`List failed (${res.status})`);
  return res.json();
}

export async function getConversation(id) {
  const res = await fetch(withSlash(`conversations/${id}`));
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return res.json();
}
