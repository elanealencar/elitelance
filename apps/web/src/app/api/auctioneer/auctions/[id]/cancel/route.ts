import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  _request: NextRequest,
  context: RouteContext
) {
  const token = (await cookies()).get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const response = await fetch(
      `${API_URL}/auctions/${encodeURIComponent(id)}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível cancelar o leilão." },
      { status: 502 }
    );
  }
}