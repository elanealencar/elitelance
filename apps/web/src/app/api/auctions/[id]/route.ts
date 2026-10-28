import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { id } = await params;

  if (!API_URL) {
    return NextResponse.json(
      { message: "API não configurada." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/auctions`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Não foi possível consultar o leilão." },
        { status: response.status }
      );
    }

    const data = await response.json();

    const auction = data.lots?.find(
      (lot: { id: string }) => lot.id === id
    );

    if (!auction) {
      return NextResponse.json(
        { message: "Leilão não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { auction },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro de conexão com a API." },
      { status: 502 }
    );
  }
}