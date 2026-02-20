"use client";

import { useEffect, useState, use } from "react";
import { UpvoteButton } from "@/components/UpvoteButton";
import { TaskList } from "@/components/TaskList";
import { CommentSection } from "@/components/CommentSection";
import Link from "next/link";

interface Feature {
  title: string;
  description: string;
}

interface TaskLink {
  id: string;
  url: string;
  label: string;
  createdByAnonId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  effort: string;
  status: string;
  claimedByAnonId: string | null;
  links: TaskLink[];
}

interface Comment {
  id: string;
  body: string;
  nickname: string | null;
  createdByAnonId: string;
  createdAt: string;
}

interface SimilarIdea {
  id: string;
  title: string;
  similarity: number;
}

interface IdeaDetail {
  id: string;
  createdAt: string;
  title: string;
  problemStatement: string;
  tags: string[];
  features: Feature[];
  openQuestions: string[];
  upvotesCount: number;
  commentsCount: number;
  tasks: Task[];
  comments: Comment[];
  hasVoted: boolean;
  similarIdeas: SimilarIdea[];
  isOwner: boolean;
}

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ideas/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => setIdea(d.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">
          {error || "Idea not found"}
        </p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to ideas
        </Link>

        <div className="flex items-start gap-4">
          <UpvoteButton
            ideaId={idea.id}
            initialCount={idea.upvotesCount}
            initialHasVoted={idea.hasVoted}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
            <p className="text-gray-600 mt-2">{idea.problemStatement}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Core Features
        </h2>
        <div className="grid gap-3">
          {idea.features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Tasks ({idea.tasks.filter((t) => t.status === "done").length}/
          {idea.tasks.length} done)
        </h2>
        <TaskList tasks={idea.tasks} onUpdate={(tasks) => setIdea({ ...idea, tasks })} />
      </section>

      {/* Open Questions */}
      {idea.openQuestions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Open Questions
          </h2>
          <ul className="space-y-2">
            {idea.openQuestions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-amber-500 mt-0.5">?</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Similar Ideas */}
      {idea.similarIdeas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Similar Ideas
          </h2>
          <div className="space-y-2">
            {idea.similarIdeas.map((sim) => (
              <Link
                key={sim.id}
                href={`/ideas/${sim.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {sim.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(sim.similarity * 100)}% similar
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Comments ({idea.commentsCount})
        </h2>
        <CommentSection ideaId={idea.id} initialComments={idea.comments} />
      </section>
    </div>
  );
}
