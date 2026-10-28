import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const token = (await cookies()).get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Faça login para participar do leilão." },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!API_URL) {
    return NextResponse.json(
      { message: "API não configurada." },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dados do lance inválidos." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auctions/${encodeURIComponent(id)}/bids`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao servidor." },
      { status: 502 }
    );
  }
}