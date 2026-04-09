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

  const agent = await prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      user: { select: { name: true, email: true, role: true, phone: true } },
      agentProperties: {
        include: {
          property: {
            select: { id: true, name: true, address: true, latitude: true, longitude: true },
          },
        },
      },
      tours: {
        where: {
          status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
          scheduledDate: { gte: new Date() },
        },
        include: {
          property: { select: { name: true, latitude: true, longitude: true } },
        },
        orderBy: { scheduledDate: "asc" },
        take: 20,
      },
      tourSlots: { where: { isActive: true } },
    },
  });

  if (!agent) return notFound("Agent not found");

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return notFound("Agent not found");

  const { propertyIds, userName, userPhone, ...agentData } = body;

  // Update agent fields
  const agent = await prisma.agent.update({
    where: { id },
    data: agentData,
  });

  // Update user fields if provided
  if (userName || userPhone) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(userName && { name: userName }),
        ...(userPhone && { phone: userPhone }),
      },
    });
  }

  // Update property assignments if provided
  if (propertyIds) {
    await prisma.agentProperty.deleteMany({ where: { agentId: id } });
    if (propertyIds.length) {
      await prisma.agentProperty.createMany({
        data: propertyIds.map((pid: string, i: number) => ({
          agentId: id,
          propertyId: pid,
          isPrimary: i === 0,
        })),
      });
    }
  }

  return NextResponse.json(agent);
}
