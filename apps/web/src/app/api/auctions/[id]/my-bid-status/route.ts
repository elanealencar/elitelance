import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auctions/${encodeURIComponent(id)}/my-bid-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Erro ao consultar situação do lance" },
      { status: 502 }
    );
  }
}