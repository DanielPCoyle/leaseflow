import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Resident endpoint: Get the current user's active lease.
 * Requires authentication - matches user email to lease tenant email.
 */
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
    include: {
      unit: {
        select: {
          unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, floor: true,
          property: {
            select: { name: true, address: true, city: true, state: true, zip: true, phone: true, email: true },
          },
        },
      },
      payments: {
        orderBy: { dueDate: "desc" },
        take: 12,
      },
      maintenanceRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!lease) {
    return NextResponse.json({ error: "No active lease found" }, { status: 404 });
  }

  return NextResponse.json(lease);
}
