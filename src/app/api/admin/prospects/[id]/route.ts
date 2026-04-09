import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      tours: {
        include: {
          property: { select: { name: true } },
          agent: { include: { user: { select: { name: true } } } },
        },
        orderBy: { scheduledDate: "desc" },
      },
      applications: {
        include: { property: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      communications: {
        orderBy: { sentAt: "desc" },
        take: 50,
      },
      tasks: {
        include: { agent: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!prospect) return notFound("Prospect not found");

  return NextResponse.json(prospect);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.prospect.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return notFound("Prospect not found");

  const prospect = await prisma.prospect.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(prospect);
}
