"use client";

import { useState } from "react";

export function UpvoteButton({
  ideaId,
  initialCount,
  initialHasVoted,
}: {
  ideaId: string;
  initialCount: number;
  initialHasVoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isPending, setIsPending] = useState(false);

  async function handleVote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    setIsPending(true);
    const newVoted = !hasVoted;
    setHasVoted(newVoted);
    setCount((c) => (newVoted ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/ideas/${ideaId}/upvote`, {
        method: newVoted ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setHasVoted(!newVoted);
        setCount((c) => (newVoted ? c - 1 : c + 1));
      }
    } catch {
      setHasVoted(!newVoted);
      setCount((c) => (newVoted ? c - 1 : c + 1));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        hasVoted
          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
      }`}
    >
      <svg
        className="w-4 h-4"
        fill={hasVoted ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
      {count}
    </button>
  );
}
