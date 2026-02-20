export function hotScore(upvotes: number, createdAt: Date): number {
  const ageInHours =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return Math.log10(Math.max(upvotes, 1)) - ageInHours / 24;
}
