"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const router = useRouter();
  const [rawInputText, setRawInputText] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [platform, setPlatform] = useState("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInputText,
          targetUsers: targetUsers || undefined,
          platform: platform || undefined,
          constraints: constraints || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Something went wrong");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/ideas/${data.data.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Submit an Idea
      </h1>
      <p className="text-gray-500 mb-8">
        Describe your product idea and our AI will turn it into a structured
        specification with features and tasks.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="idea"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Idea *
          </label>
          <textarea
            id="idea"
            value={rawInputText}
            onChange={(e) => setRawInputText(e.target.value)}
            placeholder="Describe your product idea in detail. What problem does it solve? Who is it for? What should it do?"
            rows={6}
            required
            minLength={20}
            maxLength={5000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">
            {rawInputText.length}/5000 characters (min 20)
          </p>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
            Optional details
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="target"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Target Users
              </label>
              <input
                id="target"
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g., small business owners, students, developers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="platform"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Any</option>
                <option value="Web">Web</option>
                <option value="Mobile">Mobile</option>
                <option value="Desktop">Desktop</option>
                <option value="CLI">CLI</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="constraints"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Constraints
              </label>
              <input
                id="constraints"
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g., no login required, privacy-first, low budget"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </details>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || rawInputText.length < 20}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating Requirements...
            </>
          ) : (
            "Generate Requirements"
          )}
        </button>
      </form>
    </div>
  );
}
