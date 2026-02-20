"use client";

import Link from "next/link";

export default function IdeaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Failed to load idea
      </h1>
      <p className="text-gray-500 mb-8">
        {error.message || "Could not load this idea."}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
