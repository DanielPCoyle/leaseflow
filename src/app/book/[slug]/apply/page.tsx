import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/booking/ApplicationForm";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ company?: string; unitId?: string }>;
}) {
  const { slug } = await params;
  const { company: companySlug, unitId } = await searchParams;

  if (!companySlug) notFound();

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, settings: true },
  });
  if (!company) notFound();

  const property = await prisma.property.findFirst({
    where: { slug, companyId: company.id, isActive: true },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });
  if (!property) notFound();

  const settings = company.settings as Record<string, unknown> | null;
  const applicationFee = (settings?.applicationFee as number) || 50;

  // Get unit details if specified
  let unit = null;
  if (unitId) {
    unit = await prisma.unit.findFirst({
      where: { id: unitId, propertyId: property.id, status: "VACANT" },
      select: { id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, marketRent: true },
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Apply for {property.name}
        </h1>
        <p className="text-sm text-muted mt-1">
          {property.address}, {property.city}, {property.state} {property.zip}
        </p>
        {unit && (
          <p className="text-sm text-primary mt-1">
            Unit #{unit.unitNumber} - {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}bd`} / {unit.bathrooms}ba
            {unit.marketRent && ` - $${unit.marketRent.toLocaleString()}/mo`}
          </p>
        )}
        <p className="text-xs text-muted mt-2">
          Application fee: ${applicationFee} per applicant
        </p>
      </div>

      <ApplicationForm
        propertyId={property.id}
        propertyName={property.name}
        unitId={unit?.id}
        applicationFee={applicationFee}
      />
    </div>
  );
}
