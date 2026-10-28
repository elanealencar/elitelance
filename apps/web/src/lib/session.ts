import "server-only";

import { cookies } from "next/headers";
import type { AuthUser, UserRole } from "@/services/auth";
import { redirect } from "next/navigation";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("elitelance_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    // Aceita tanto { user: {...} } quanto o usuário diretamente.
    const user =
      typeof data === "object" &&
      data !== null &&
      "user" in data
        ? data.user
        : data;

    if (
      typeof user !== "object" ||
      user === null ||
      !("id" in user) ||
      !("name" in user) ||
      !("email" in user) ||
      !("role" in user) ||
      typeof user.id !== "string" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      !["BIDDER", "AUCTIONEER"].includes(String(user.role))
    ) {
      return null;
    }

    return user as AuthUser;
  } catch {
    return null;
  }
}

export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    redirect(
      user.role === "AUCTIONEER" ? "/auctioneer" : "/bidder"
    );
  }

  return user;
}