export type UserRole = "BIDDER" | "AUCTIONEER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Não foi possível realizar o login."
    );
  }

  if (!data?.user?.role) {
    throw new Error("Resposta de autenticação inválida.");
  }

  return data as LoginResponse;
}