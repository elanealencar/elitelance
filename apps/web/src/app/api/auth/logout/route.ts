import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Sessão encerrada com sucesso.",
  });

  response.cookies.set("elitelance_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}