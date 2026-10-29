import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auctions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível criar o leilão." },
      { status: 502 }
    );
  }
}