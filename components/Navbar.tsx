"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/me/nickname")
      .then((r) => r.json())
      .then((d) => setNickname(d.data?.nickname || null))
      .catch(() => {});
  }, []);

  async function saveNickname() {
    if (!input.trim()) return;
    const res = await fetch("/api/me/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: input.trim() }),
    });
    if (res.ok) {
      const d = await res.json();
      setNickname(d.data.nickname);
      setEditing(false);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-indigo-600">
          DemandBoard
        </Link>

        <div className="flex items-center gap-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                placeholder="Your nickname"
                className="px-2 py-1 border rounded text-sm w-32"
                autoFocus
              />
              <button
                onClick={saveNickname}
                className="text-sm text-indigo-600 hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setInput(nickname || "");
                setEditing(true);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {nickname || "Set nickname"}
            </button>
          )}

          <Link
            href="/submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Submit Idea
          </Link>
        </div>
      </div>
    </nav>
  );
}
