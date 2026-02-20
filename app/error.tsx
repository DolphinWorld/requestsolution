"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-500 mb-8">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
