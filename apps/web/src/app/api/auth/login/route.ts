
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function POST(request: NextRequest) {
  try {
    const credentials = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            typeof data?.message === "string"
              ? data.message
              : "E-mail ou senha inválidos.",
        },
        { status: response.status }
      );
    }

    if (
      typeof data.accessToken !== "string" ||
      !["BIDDER", "AUCTIONEER"].includes(data.user?.role)
    ) {
      return NextResponse.json(
        { message: "Resposta de autenticação inválida." },
        { status: 502 }
      );
    }

    const result = NextResponse.json({
      user: data.user,
    });

    result.cookies.set("elitelance_session", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.min(
        Number(data.expiresIn) || 3600,
        3600
      ),
    });

    return result;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao servidor." },
      { status: 500 }
    );
  }
}
