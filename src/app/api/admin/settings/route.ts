import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      name: true, slug: true, logoUrl: true, website: true,
      phone: true, email: true, address: true, city: true,
      state: true, zip: true, plan: true, unitCount: true,
      portfolioBrowsingEnabled: true, settings: true,
    },
  });

  return NextResponse.json(company);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  // Only company admins can update settings
  if (user.role !== "COMPANY_ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only admins can update settings" }, { status: 403 });
  }

  const body = await request.json();

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: body,
  });

  return NextResponse.json(company);
}
