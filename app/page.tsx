"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IdeaCard } from "@/components/IdeaCard";

interface Idea {
  id: string;
  title: string;
  problemStatement: string;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  createdAt: string;
  tasks: { id: string; status: string }[];
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sort = searchParams.get("sort") || "hot";
  const search = searchParams.get("search") || "";

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(search);

  const fetchIdeas = useCallback(
    async (p: number = 1) => {
      setLoading(true);
      const params = new URLSearchParams({
        sort,
        page: String(p),
        limit: "20",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLoading(false);
    },
    [sort, search]
  );

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  function setSort(newSort: string) {
    const params = new URLSearchParams();
    params.set("sort", newSort);
    if (search) params.set("search", search);
    router.push(`/?${params}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (searchInput.trim()) params.set("search", searchInput.trim());
    router.push(`/?${params}`);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ideas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "idea" : "ideas"} submitted
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search ideas..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-1 mb-6">
        {["hot", "new"].map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === s
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No ideas yet</p>
          <a
            href="/submit"
            className="text-indigo-600 hover:underline font-medium"
          >
            Be the first to submit an idea
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => fetchIdeas(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchIdeas(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
        >
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
