"use client";

import { useState } from "react";

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

const statusColors: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

const effortColors: Record<string, string> = {
  S: "bg-emerald-50 text-emerald-700",
  M: "bg-yellow-50 text-yellow-700",
  L: "bg-orange-50 text-orange-700",
  XL: "bg-red-50 text-red-700",
};

export function TaskList({
  tasks,
  onUpdate,
}: {
  tasks: Task[];
  onUpdate: (tasks: Task[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function claimTask(taskId: string) {
    setActionLoading(taskId);
    const res = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      onUpdate(tasks.map((t) => (t.id === taskId ? { ...t, ...d.data } : t)));
    }
    setActionLoading(null);
  }

  async function unclaimTask(taskId: string) {
    setActionLoading(taskId);
    const res = await fetch(`/api/tasks/${taskId}/claim`, {
      method: "DELETE",
    });
    if (res.ok) {
      const d = await res.json();
      onUpdate(tasks.map((t) => (t.id === taskId ? { ...t, ...d.data } : t)));
    }
    setActionLoading(null);
  }

  async function updateStatus(taskId: string, status: string) {
    setActionLoading(taskId);
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const d = await res.json();
      onUpdate(tasks.map((t) => (t.id === taskId ? { ...t, ...d.data } : t)));
    }
    setActionLoading(null);
  }

  async function addLink(taskId: string) {
    if (!linkUrl.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkUrl, label: linkLabel || undefined }),
    });
    if (res.ok) {
      const d = await res.json();
      onUpdate(
        tasks.map((t) =>
          t.id === taskId ? { ...t, links: [...t.links, d.data] } : t
        )
      );
      setLinkUrl("");
      setLinkLabel("");
    }
  }

  async function deleteLink(taskId: string, linkId: string) {
    const res = await fetch(`/api/task-links/${linkId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onUpdate(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, links: t.links.filter((l) => l.id !== linkId) }
            : t
        )
      );
    }
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isExpanded = expandedId === task.id;
        const isLoading = actionLoading === task.id;

        return (
          <div
            key={task.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId(isExpanded ? null : task.id)
              }
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50"
            >
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  statusColors[task.status]
                }`}
              >
                {statusLabels[task.status]}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  effortColors[task.effort]
                }`}
              >
                {task.effort}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900">
                {task.title}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}

                {task.acceptanceCriteria && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Acceptance Criteria
                    </p>
                    <p className="text-sm text-gray-700">
                      {task.acceptanceCriteria}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {task.status === "open" && (
                    <button
                      onClick={() => claimTask(task.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Claim Task
                    </button>
                  )}
                  {task.claimedByAnonId && task.status !== "done" && (
                    <>
                      {task.status === "in_progress" && (
                        <button
                          onClick={() => updateStatus(task.id, "done")}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark Done
                        </button>
                      )}
                      <button
                        onClick={() => unclaimTask(task.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                      >
                        Unclaim
                      </button>
                    </>
                  )}
                  {task.status === "done" && (
                    <button
                      onClick={() => updateStatus(task.id, "open")}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>

                {/* Links */}
                {task.links.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Links</p>
                    {task.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline truncate"
                        >
                          {link.label || link.url}
                        </a>
                        <button
                          onClick={() => deleteLink(task.id, link.id)}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Link */}
                {task.claimedByAnonId && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                    <input
                      type="text"
                      value={linkLabel}
                      onChange={(e) => setLinkLabel(e.target.value)}
                      placeholder="Label"
                      className="w-24 px-2 py-1.5 border rounded text-sm"
                    />
                    <button
                      onClick={() => addLink(task.id)}
                      className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
