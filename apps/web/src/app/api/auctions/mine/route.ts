import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/auctions/mine`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Erro ao consultar seus leilões" },
      { status: 502 }
    );
  }
}