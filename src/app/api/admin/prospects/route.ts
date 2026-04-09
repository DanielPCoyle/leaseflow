import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { companyId: user.companyId };
  if (status) where.status = status;
  if (source) where.source = source;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const prospects = await prisma.prospect.findMany({
    where,
    include: {
      _count: {
        select: { tours: true, applications: true, communications: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(prospects);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { firstName, lastName, email, ...rest } = body;

  if (!firstName || !lastName || !email) {
    return badRequest("firstName, lastName, and email are required");
  }

  const prospect = await prisma.prospect.create({
    data: {
      companyId: user.companyId,
      firstName,
      lastName,
      email,
      ...rest,
    },
  });

  return NextResponse.json(prospect, { status: 201 });
}
