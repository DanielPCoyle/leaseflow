import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findFirst({
    where: {
      primaryTenantEmail: session.user.email,
      status: { in: ["ACTIVE", "MONTH_TO_MONTH"] },
    },
    select: { id: true },
  });

  if (!lease) {
    return NextResponse.json({ error: "No active lease" }, { status: 404 });
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where: { leaseId: lease.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findFirst({
    where: {
      primaryTenantEmail: session.user.email,
      status: { in: ["ACTIVE", "MONTH_TO_MONTH"] },
    },
    select: { id: true, unitId: true },
  });

  if (!lease) {
    return NextResponse.json({ error: "No active lease" }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, category, priority, photos } = body;

  if (!title || !description || !category) {
    return NextResponse.json(
      { error: "title, description, and category are required" },
      { status: 400 }
    );
  }

  const maintenanceRequest = await prisma.maintenanceRequest.create({
    data: {
      leaseId: lease.id,
      unitId: lease.unitId,
      title,
      description,
      category,
      priority: priority || "NORMAL",
      photos: photos || null,
    },
  });

  return NextResponse.json(maintenanceRequest, { status: 201 });
}
