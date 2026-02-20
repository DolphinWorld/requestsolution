import { cookies } from "next/headers";

export async function getAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const anonId = cookieStore.get("anon_id")?.value;
  if (!anonId) {
    throw new Error("anon_id cookie not found");
  }
  return anonId;
}
