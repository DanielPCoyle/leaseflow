import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UnitStatusBadge } from "@/components/admin/UnitStatusBadge";
import { UnitsFilter } from "@/components/admin/UnitsFilter";
import { UnitStatus } from "@/generated/prisma/client";

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; status?: string; bedrooms?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const filters = await searchParams;
  const companyId = session.user.companyId;

  const where: Record<string, unknown> = {
    property: { companyId },
  };
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.status) where.status = filters.status;
  if (filters.bedrooms) where.bedrooms = parseInt(filters.bedrooms);

  const [units, properties, statusCounts] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        floorPlan: { select: { id: true, name: true } },
      },
      orderBy: [
        { property: { name: "asc" } },
        { floor: "asc" },
        { unitNumber: "asc" },
      ],
    }),
    prisma.property.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
    }),
  ]);

  const counts = statusCounts.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalUnits = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">
            Units
          </h1>
          <p className="text-sm text-muted">{totalUnits} total units across all properties</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(
          [
            ["VACANT", "success", "check_circle"],
            ["OCCUPIED", "primary", "person"],
            ["NOTICE_GIVEN", "warning", "schedule"],
            ["MAINTENANCE", "danger", "build"],
            ["MODEL", "accent", "visibility"],
          ] as const
        ).map(([status, color, icon]) => (
          <Link
            key={status}
            href={
              filters.status === status
                ? "/admin/units"
                : `/admin/units?status=${status}${filters.propertyId ? `&propertyId=${filters.propertyId}` : ""}`
            }
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
              filters.status === status
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/30"
            }`}
          >
            <span className={`material-icons text-[16px] text-${color}`}>
              {icon}
            </span>
            <span className="font-medium">{counts[status] ?? 0}</span>
            <span className="text-muted">
              {status.replace("_", " ").toLowerCase()}
            </span>
          </Link>
        ))}
      </div>

      <UnitsFilter
        properties={properties}
        currentPropertyId={filters.propertyId}
        currentStatus={filters.status}
        currentBedrooms={filters.bedrooms}
      />

      {/* Units Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Floor</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Bed/Bath</th>
              <th className="px-4 py-3">SqFt</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {units.map((unit) => (
              <tr key={unit.id} className="hover:bg-surface/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/properties/${unit.property.id}`}
                    className="text-primary hover:underline"
                  >
                    {unit.property.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{unit.unitNumber}</td>
                <td className="px-4 py-3 text-muted">{unit.floor ?? "-"}</td>
                <td className="px-4 py-3 text-muted">
                  {unit.floorPlan?.name ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}bd`} /{" "}
                  {unit.bathrooms}ba
                </td>
                <td className="px-4 py-3 text-muted">
                  {unit.sqft?.toLocaleString() ?? "-"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {unit.marketRent
                    ? `$${unit.marketRent.toLocaleString()}`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <UnitStatusBadge status={unit.status as UnitStatus} />
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {unit.availableDate
                    ? new Date(unit.availableDate).toLocaleDateString()
                    : unit.status === "VACANT"
                      ? "Now"
                      : "-"}
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No units match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
