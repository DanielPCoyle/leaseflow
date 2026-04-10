import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendApplicationConfirmation } from "@/lib/email";

/**
 * Public endpoint: Submit a rental application.
 * POST /api/public/applications
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    propertyId,
    unitId,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    currentAddress,
    employer,
    jobTitle,
    monthlyIncome,
    employmentLength,
    references,
    hasPets,
    petDetails,
    desiredMoveIn,
    desiredBedrooms,
    budgetMax,
    notes,
  } = body;

  if (!propertyId || !firstName || !lastName || !email || !phone) {
    return NextResponse.json(
      { error: "propertyId, firstName, lastName, email, and phone are required" },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, companyId: true, isActive: true },
  });

  if (!property || !property.isActive) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Find or create prospect
  let prospect = await prisma.prospect.findFirst({
    where: { email, companyId: property.companyId },
  });

  if (!prospect) {
    prospect = await prisma.prospect.create({
      data: {
        companyId: property.companyId,
        firstName,
        lastName,
        email,
        phone,
        desiredBedrooms: desiredBedrooms ?? null,
        budgetMax: budgetMax ?? null,
        desiredMoveIn: desiredMoveIn ? new Date(desiredMoveIn) : null,
        hasPets: hasPets || false,
        petDetails: petDetails || null,
        status: "APPLIED",
        source: "website",
      },
    });
  } else {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: "APPLIED" },
    });
  }

  const application = await prisma.application.create({
    data: {
      prospectId: prospect.id,
      propertyId,
      unitId: unitId || undefined,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      currentAddress: currentAddress || null,
      employer: employer || null,
      jobTitle: jobTitle || null,
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      employmentLength: employmentLength || null,
      references: references || null,
      status: "SUBMITTED",
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
  });

  // Fetch application fee from company settings
  const company = await prisma.company.findUnique({
    where: { id: property.companyId },
    select: { settings: true },
  });
  const settings = company?.settings as Record<string, unknown> | null;
  const applicationFee = (settings?.applicationFee as number) || 50;

  // Send confirmation email (non-blocking)
  sendApplicationConfirmation({
    to: email,
    applicantName: `${firstName} ${lastName}`,
    propertyName: application.property.name,
    unitNumber: application.unit?.unitNumber ?? null,
    applicationFee,
  }).catch((err) => console.error("Application confirmation email failed:", err));

  return NextResponse.json(
    {
      success: true,
      application: {
        id: application.id,
        propertyName: application.property.name,
        status: application.status,
      },
    },
    { status: 201 }
  );
}
