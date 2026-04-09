import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const [property, regions] = await Promise.all([
    prisma.property.findFirst({
      where: { id, companyId: session.user.companyId },
      select: {
        id: true, name: true, slug: true, address: true, city: true,
        state: true, zip: true, regionId: true, phone: true, email: true,
        description: true, propertyType: true, yearBuilt: true,
        totalUnits: true, stories: true,
      },
    }),
    prisma.region.findMany({
      where: { companyId: session.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!property) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        Edit {property.name}
      </h1>
      <PropertyForm regions={regions} initialData={property} />
    </div>
  );
}
