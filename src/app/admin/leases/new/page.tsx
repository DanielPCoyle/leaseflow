import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeaseForm } from "@/components/admin/LeaseForm";

export default async function NewLeasePage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const [units, applications] = await Promise.all([
    prisma.unit.findMany({
      where: { property: { companyId: session.user.companyId }, status: "VACANT" },
      select: {
        id: true, unitNumber: true, marketRent: true, bedrooms: true,
        property: { select: { name: true } },
      },
      orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
    }),
    prisma.application.findMany({
      where: { property: { companyId: session.user.companyId }, status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, unitId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">New Lease</h1>
      <LeaseForm
        units={units.map((u) => ({
          id: u.id,
          label: `${u.property.name} - #${u.unitNumber} (${u.bedrooms === 0 ? "Studio" : `${u.bedrooms}bd`}) $${u.marketRent?.toLocaleString()}/mo`,
          marketRent: u.marketRent,
        }))}
        applications={applications.map((a) => ({
          id: a.id,
          label: `${a.firstName} ${a.lastName} (${a.email})`,
          name: `${a.firstName} ${a.lastName}`,
          email: a.email,
          phone: a.phone,
          unitId: a.unitId,
        }))}
      />
    </div>
  );
}
