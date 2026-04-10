import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest, requireRole } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const agents = await prisma.agent.findMany({
    where: { companyId: user.companyId },
    include: {
      user: { select: { name: true, email: true, role: true, isActive: true } },
      agentProperties: {
        include: {
          property: { select: { id: true, name: true, latitude: true, longitude: true } },
        },
      },
      _count: {
        select: {
          tours: { where: { status: { in: ["SCHEDULED", "CONFIRMED"] } } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();
  const roleCheck = requireRole(user.role, "COMPANY_ADMIN");
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { name, email, password, role, title, transportMode, bufferMinutes, propertyIds } = body;

  if (!name || !email || !password) {
    return badRequest("Name, email, and password are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return badRequest("Email already in use");

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      companyId: user.companyId,
      name,
      email,
      passwordHash,
      role: role || "AGENT",
    },
  });

  const agent = await prisma.agent.create({
    data: {
      userId: newUser.id,
      companyId: user.companyId,
      title: title || null,
      transportMode: transportMode || "CAR",
      bufferMinutes: bufferMinutes ?? 15,
    },
  });

  if (propertyIds?.length) {
    await prisma.agentProperty.createMany({
      data: propertyIds.map((pid: string, i: number) => ({
        agentId: agent.id,
        propertyId: pid,
        isPrimary: i === 0,
      })),
    });
  }

  return NextResponse.json(agent, { status: 201 });
}
