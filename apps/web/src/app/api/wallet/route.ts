import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Usuário não autenticado." },
      { status: 401 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "API não configurada." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Erro ao consultar a carteira." },
      { status: 502 }
    );
  }
}