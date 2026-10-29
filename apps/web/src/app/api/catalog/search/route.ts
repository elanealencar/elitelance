import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("elitelance_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Não autenticado" },
      { status: 401 }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const url = new URL(`${API_URL}/catalog/search`);
    url.searchParams.set("q", query);

    const response = await fetch(url, {
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
      { message: "Não foi possível consultar o catálogo." },
      { status: 502 }
    );
  }
}