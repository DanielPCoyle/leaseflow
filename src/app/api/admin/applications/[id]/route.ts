import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/api-auth";
import { sendApplicationDecision } from "@/lib/email";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, property: { companyId: user.companyId } },
    include: {
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { id: true, unitNumber: true, bedrooms: true, bathrooms: true, marketRent: true } },
      prospect: { select: { id: true, firstName: true, lastName: true, email: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!application) return notFound("Application not found");

  return NextResponse.json(application);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.application.findFirst({
    where: { id, property: { companyId: user.companyId } },
  });
  if (!existing) return notFound("Application not found");

  // Handle decision timestamps
  const extraData: Record<string, unknown> = {};
  if (body.status === "APPROVED" || body.status === "DENIED") {
    extraData.decidedAt = new Date();
    extraData.decidedBy = user.id;
  }

  const application = await prisma.application.update({
    where: { id },
    data: { ...body, ...extraData },
    include: { property: { select: { name: true } } },
  });

  // Send decision email on approve/deny (non-blocking)
  if (body.status === "APPROVED" || body.status === "DENIED") {
    sendApplicationDecision({
      to: application.email,
      applicantName: `${application.firstName} ${application.lastName}`,
      propertyName: application.property.name,
      decision: body.status,
      decisionNote: body.decisionNote,
    }).catch((err) => console.error("Decision email failed:", err));
  }

  // Update prospect status based on application decision
  if (existing.prospectId && body.status) {
    const statusMap: Record<string, string> = {
      APPROVED: "APPROVED",
      DENIED: "LOST",
      SCREENING: "APPLIED",
    };
    if (statusMap[body.status]) {
      await prisma.prospect.update({
        where: { id: existing.prospectId },
        data: { status: statusMap[body.status] as "APPROVED" | "LOST" | "APPLIED" },
      });
    }
  }

  return NextResponse.json(application);
}
