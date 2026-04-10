import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Role hierarchy: SUPER_ADMIN > COMPANY_ADMIN > REGIONAL_MANAGER > PROPERTY_MANAGER > AGENT
 * Returns true if the user's role meets or exceeds the required level.
 */
const ROLE_LEVELS: Record<string, number> = {
  SUPER_ADMIN: 5,
  COMPANY_ADMIN: 4,
  REGIONAL_MANAGER: 3,
  PROPERTY_MANAGER: 2,
  AGENT: 1,
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 0);
}

/**
 * Require a minimum role. Returns a forbidden response if not met, or null if OK.
 */
export function requireRole(userRole: string, requiredRole: string): NextResponse | null {
  if (!hasRole(userRole, requiredRole)) {
    return NextResponse.json(
      { error: `Requires ${requiredRole.replace(/_/g, " ").toLowerCase()} or higher` },
      { status: 403 }
    );
  }
  return null;
}
