import os
from typing import List, Dict, Union
import numpy as np
from google import generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

CHAT_MODEL = "gemini-2.0-flash"
EMBED_MODEL = "text-embedding-004"

def gemini_chat(messages: List[Dict[str, str]]) -> str:
    try:
        sys_text = "\n".join(m["content"] for m in messages if m["role"]=="system").strip()
        lines = [f'{m["role"].upper()}: {m["content"]}' for m in messages if m["role"] in ("user","assistant")]
        prompt = (f"SYSTEM:\n{sys_text}\n\n" if sys_text else "") + "\n".join(lines) + "\nASSISTANT:"
        resp = genai.GenerativeModel(CHAT_MODEL).generate_content(prompt)
        return (resp.text or "").strip()
    except Exception as e:
        return f"(AI error: {e})"

def gemini_embed(texts: Union[str, List[str]]) -> List[List[float]]:
    if isinstance(texts, str):
        texts = [texts]
    try:
        res = genai.embed_content(model=EMBED_MODEL, content=texts)
        if isinstance(res, dict) and "embedding" in res:   # single
            return [res["embedding"]]
        if isinstance(res, dict) and "embeddings" in res:  # batch
            return [e.get("values", e) for e in res["embeddings"]]
        return res  # best effort
    except Exception:
        return [[0.0]*768 for _ in texts]

def cosine(a: List[float], b: List[float]) -> float:
    va = np.array(a, dtype=float); vb = np.array(b, dtype=float)
    denom = (np.linalg.norm(va)*np.linalg.norm(vb)) + 1e-9
    return float(va @ vb / denom)

def summarize_and_tag(text_dump: str) -> (str, list):
    sys = {"role":"system","content":"You are a concise conversation analyst."}
    user = {"role":"user","content":(
        "Summarize the conversation in 5–8 bullet points.\n"
        "Write a 2–3 line abstract.\n"
        "Finally output a line exactly like: TAGS: tag1, tag2, tag3\n\n"
        f"Conversation:\n{text_dump}"
    )}
    out = gemini_chat([sys, user])
    tags = []
    for line in out.splitlines()[::-1]:
        if line.strip().upper().startswith("TAGS:"):
            tags = [t.strip() for t in line.split(":",1)[1].split(",") if t.strip()]
            break
    return out, tags
