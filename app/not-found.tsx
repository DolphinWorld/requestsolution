import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-lg text-gray-500 mb-8">Page not found</p>
      <Link
        href="/"
        className="text-indigo-600 hover:underline font-medium"
      >
        Back to home
      </Link>
    </div>
  );
}
