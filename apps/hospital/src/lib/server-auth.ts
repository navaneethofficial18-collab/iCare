import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { verifyToken } from "@/lib/auth";

export type AppRole = "hospital" | "doctor" | "patient" | "admin";

export async function getAuthenticatedAccessPayload(allowedRoles?: AppRole[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload?.sub || payload.type !== "access") {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(payload.role as AppRole)) {
    return null;
  }

  return payload as typeof payload & { sub: string; role: AppRole };
}
