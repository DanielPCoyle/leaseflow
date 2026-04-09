import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { UnitStatusBadge } from "@/components/admin/UnitStatusBadge";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      region: true,
      amenities: { orderBy: { category: "asc" } },
      floorPlans: {
        where: { isActive: true },
        orderBy: { bedrooms: "asc" },
        include: { _count: { select: { units: true } } },
      },
      units: {
        orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
        include: { floorPlan: { select: { name: true } } },
      },
      agentProperties: {
        include: {
          agent: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!property) notFound();

  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const vacant = property.units.filter((u) => u.status === "VACANT").length;
  const noticeGiven = property.units.filter(
    (u) => u.status === "NOTICE_GIVEN"
  ).length;
  const maintenance = property.units.filter(
    (u) => u.status === "MAINTENANCE"
  ).length;
  const total = property.units.length;
  const occupancyRate =
    total > 0 ? Math.round((occupied / total) * 100) : 0;

  const amenitiesByCategory = property.amenities.reduce(
    (acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    },
    {} as Record<string, typeof property.amenities>
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/properties"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[18px]">arrow_back</span>
          Properties
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary dark:text-white">
              {property.name}
            </h1>
            <p className="text-sm text-muted">
              {property.address}, {property.city}, {property.state}{" "}
              {property.zip}
            </p>
            {property.region && (
              <p className="mt-1 text-xs text-muted">
                <span className="material-icons text-[14px] mr-1 align-text-bottom">
                  location_on
                </span>
                {property.region.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/properties/${property.id}/edit`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              <span className="material-icons text-[18px]">edit</span>
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total Units" value={total} icon="door_front" />
        <StatCard
          label="Occupancy"
          value={`${occupancyRate}%`}
          icon="pie_chart"
          color={occupancyRate > 90 ? "success" : occupancyRate > 70 ? "primary" : "warning"}
        />
        <StatCard label="Vacant" value={vacant} icon="check_circle" color="success" />
        <StatCard label="Notice Given" value={noticeGiven} icon="schedule" color="warning" />
        <StatCard label="Maintenance" value={maintenance} icon="build" color="danger" />
      </div>

      {/* Floor Plans */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-secondary dark:text-white">
          Floor Plans
        </h2>
        {property.floorPlans.length === 0 ? (
          <p className="text-sm text-muted">No floor plans configured.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {property.floorPlans.map((fp) => (
              <div
                key={fp.id}
                className="rounded-xl border border-border bg-white dark:bg-secondary p-4"
              >
                <h3 className="font-medium">{fp.name}</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                  <span>
                    {fp.bedrooms === 0 ? "Studio" : `${fp.bedrooms} bed`}
                  </span>
                  <span>{fp.bathrooms} bath</span>
                  {fp.sqft && <span>{fp.sqft.toLocaleString()} sqft</span>}
                  <span className="font-medium text-primary">
                    From ${fp.basePrice.toLocaleString()}/mo
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {fp._count.units} units with this plan
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assigned Agents */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-secondary dark:text-white">
          Assigned Agents
        </h2>
        {property.agentProperties.length === 0 ? (
          <p className="text-sm text-muted">No agents assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {property.agentProperties.map((ap) => (
              <div
                key={ap.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-secondary px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-icons text-[18px]">person</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {ap.agent.user.name}
                    {ap.isPrimary && (
                      <span className="ml-2 text-xs text-primary">Primary</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {ap.agent.title || ap.agent.user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Amenities */}
      {Object.keys(amenitiesByCategory).length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-secondary dark:text-white">
            Amenities
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-medium capitalize text-muted">
                  {category}
                </h3>
                <div className="space-y-1">
                  {amenities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {a.icon && (
                        <span className="material-icons text-[16px] text-muted">
                          {a.icon}
                        </span>
                      )}
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Units Table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary dark:text-white">
            Units
          </h2>
          <Link
            href={`/admin/properties/${property.id}/units/new`}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <span className="material-icons text-[16px]">add</span>
            Add Unit
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
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
              {property.units.map((unit) => (
                <tr key={unit.id} className="hover:bg-surface/50">
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
                    <UnitStatusBadge status={unit.status} />
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
              {property.units.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No units added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`material-icons text-[18px] ${colorClasses[color] || ""}`}
        >
          {icon}
        </span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-secondary dark:text-white">
        {value}
      </p>
    </div>
  );
}
