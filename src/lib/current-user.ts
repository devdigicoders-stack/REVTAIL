import { cookies } from "next/headers";

import { verifyToken } from "@/lib/auth";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("revtail_token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: Number(payload.userId),
    role: String(payload.role),
    name: String(payload.name),
  };
}