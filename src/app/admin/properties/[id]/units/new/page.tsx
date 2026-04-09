import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { UnitForm } from "@/components/admin/UnitForm";

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, companyId: session.user.companyId },
    select: {
      id: true, name: true,
      floorPlans: {
        where: { isActive: true },
        select: { id: true, name: true, bedrooms: true, bathrooms: true, sqft: true, basePrice: true },
        orderBy: { bedrooms: "asc" },
      },
    },
  });

  if (!property) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        Add Unit to {property.name}
      </h1>
      <UnitForm propertyId={property.id} propertyName={property.name} floorPlans={property.floorPlans} />
    </div>
  );
}
