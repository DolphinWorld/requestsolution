import Link from "next/link";
import { UpvoteButton } from "./UpvoteButton";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    problemStatement: string;
    tags: string[];
    upvotesCount: number;
    commentsCount: number;
    createdAt: string;
    tasks?: { id: string; status: string }[];
  };
  hasVoted?: boolean;
}

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IdeaCard({ idea, hasVoted = false }: IdeaCardProps) {
  const tasksDone = idea.tasks?.filter((t) => t.status === "done").length || 0;
  const tasksTotal = idea.tasks?.length || 0;

  return (
    <Link href={`/ideas/${idea.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <UpvoteButton
              ideaId={idea.id}
              initialCount={idea.upvotesCount}
              initialHasVoted={hasVoted}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{idea.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {idea.problemStatement}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {idea.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}

              <span className="text-xs text-gray-400 ml-auto flex items-center gap-3">
                {tasksTotal > 0 && (
                  <span>
                    {tasksDone}/{tasksTotal} tasks
                  </span>
                )}
                <span>{idea.commentsCount} comments</span>
                <span>{timeAgo(idea.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
