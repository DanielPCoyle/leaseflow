import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const properties = await prisma.property.findMany({
    where: { companyId: session.user.companyId },
    include: {
      region: true,
      _count: { select: { units: true, agentProperties: true } },
      units: { select: { status: true, marketRent: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">
            Properties
          </h1>
          <p className="text-sm text-muted">
            {properties.length} properties in portfolio
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">add</span>
          Add Property
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const occupied = property.units.filter(
            (u) => u.status === "OCCUPIED"
          ).length;
          const total = property.units.length;
          const occupancyRate =
            total > 0 ? Math.round((occupied / total) * 100) : 0;
          const vacant = property.units.filter(
            (u) => u.status === "VACANT"
          ).length;
          const noticeGiven = property.units.filter(
            (u) => u.status === "NOTICE_GIVEN"
          ).length;

          return (
            <Link
              key={property.id}
              href={`/admin/properties/${property.id}`}
              className="group rounded-xl border border-border bg-white dark:bg-secondary p-5 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white group-hover:text-primary transition-colors">
                    {property.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {property.address}, {property.city}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    property.isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted/10 text-muted"
                  }`}
                >
                  {property.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {property.region && (
                <p className="mb-3 text-xs text-muted">
                  <span className="material-icons text-[14px] mr-1 align-text-bottom">
                    location_on
                  </span>
                  {property.region.name}
                </p>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted">Occupancy</span>
                  <span className="font-medium">{occupancyRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      occupancyRate > 90
                        ? "bg-success"
                        : occupancyRate > 70
                          ? "bg-primary"
                          : occupancyRate > 50
                            ? "bg-warning"
                            : "bg-danger"
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-surface p-2">
                  <p className="text-lg font-semibold text-secondary dark:text-white">
                    {total}
                  </p>
                  <p className="text-xs text-muted">Units</p>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <p className="text-lg font-semibold text-success">{vacant}</p>
                  <p className="text-xs text-muted">Vacant</p>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <p className="text-lg font-semibold text-warning">
                    {noticeGiven}
                  </p>
                  <p className="text-xs text-muted">Notice</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <span className="material-icons text-[14px]">badge</span>
                  {property._count.agentProperties} agents
                </span>
                {property.propertyType !== "APARTMENT" && (
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[14px]">category</span>
                    {property.propertyType.replace("_", " ")}
                  </span>
                )}
                {property.yearBuilt && (
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[14px]">
                      calendar_today
                    </span>
                    Built {property.yearBuilt}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
