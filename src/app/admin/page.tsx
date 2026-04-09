import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UnitStatusBadge } from "@/components/admin/UnitStatusBadge";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const companyId = session.user.companyId;

  const [
    company,
    properties,
    unitStats,
    vacantUnits,
    upcomingMoveOuts,
    recentProspects,
    upcomingTours,
  ] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.property.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: { select: { units: true } },
        units: { select: { status: true, marketRent: true } },
      },
    }),
    prisma.unit.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
    }),
    prisma.unit.findMany({
      where: { property: { companyId }, status: "VACANT" },
      include: { property: { select: { name: true } } },
      orderBy: { availableDate: "asc" },
      take: 5,
    }),
    prisma.unit.findMany({
      where: {
        property: { companyId },
        status: "NOTICE_GIVEN",
        moveOutDate: { not: null },
      },
      include: { property: { select: { name: true } } },
      orderBy: { moveOutDate: "asc" },
      take: 5,
    }),
    prisma.prospect.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tour.findMany({
      where: {
        property: { companyId },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledDate: { gte: new Date() },
      },
      include: {
        property: { select: { name: true } },
        agent: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
  ]);

  const counts = unitStats.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalUnits = Object.values(counts).reduce((a, b) => a + b, 0);
  const occupiedCount = counts["OCCUPIED"] ?? 0;
  const vacantCount = counts["VACANT"] ?? 0;
  const noticeCount = counts["NOTICE_GIVEN"] ?? 0;
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

  // Estimated monthly revenue from occupied units
  const totalMonthlyRent = properties.reduce((sum, p) => {
    return (
      sum +
      p.units
        .filter((u) => u.status === "OCCUPIED")
        .reduce((s, u) => s + (u.marketRent ?? 0), 0)
    );
  }, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-muted">
          {company?.name} Portfolio Overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label="Properties"
          value={properties.length}
          icon="apartment"
          href="/admin/properties"
        />
        <KpiCard
          label="Total Units"
          value={totalUnits}
          icon="door_front"
          href="/admin/units"
        />
        <KpiCard
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon="pie_chart"
          color={occupancyRate > 90 ? "success" : occupancyRate > 70 ? "primary" : "warning"}
        />
        <KpiCard
          label="Vacant Units"
          value={vacantCount}
          icon="check_circle"
          color="success"
          href="/admin/units?status=VACANT"
        />
        <KpiCard
          label="Monthly Revenue"
          value={`$${Math.round(totalMonthlyRent).toLocaleString()}`}
          icon="payments"
          color="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property Occupancy */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-4 font-semibold text-secondary dark:text-white">
            Property Occupancy
          </h2>
          <div className="space-y-3">
            {properties.map((p) => {
              const occ = p.units.filter(
                (u) => u.status === "OCCUPIED"
              ).length;
              const tot = p.units.length;
              const rate = tot > 0 ? Math.round((occ / tot) * 100) : 0;

              return (
                <Link
                  key={p.id}
                  href={`/admin/properties/${p.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                    <span className="text-muted">
                      {occ}/{tot} ({rate}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate > 90
                          ? "bg-success"
                          : rate > 70
                            ? "bg-primary"
                            : rate > 50
                              ? "bg-warning"
                              : "bg-danger"
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Upcoming Move-Outs */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-secondary dark:text-white">
              Upcoming Move-Outs
            </h2>
            <Link
              href="/admin/units?status=NOTICE_GIVEN"
              className="text-xs text-primary hover:underline"
            >
              View all ({noticeCount})
            </Link>
          </div>
          {upcomingMoveOuts.length === 0 ? (
            <p className="text-sm text-muted">No upcoming move-outs.</p>
          ) : (
            <div className="space-y-3">
              {upcomingMoveOuts.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {unit.property.name} - Unit {unit.unitNumber}
                    </span>
                    <span className="ml-2 text-muted">
                      {unit.bedrooms === 0
                        ? "Studio"
                        : `${unit.bedrooms}bd`}{" "}
                      ${unit.marketRent?.toLocaleString()}/mo
                    </span>
                  </div>
                  <span className="text-warning text-xs">
                    {unit.moveOutDate
                      ? new Date(unit.moveOutDate).toLocaleDateString()
                      : "TBD"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Vacant Units Ready to Show */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-secondary dark:text-white">
              Available Units
            </h2>
            <Link
              href="/admin/units?status=VACANT"
              className="text-xs text-primary hover:underline"
            >
              View all ({vacantCount})
            </Link>
          </div>
          {vacantUnits.length === 0 ? (
            <p className="text-sm text-muted">No vacant units.</p>
          ) : (
            <div className="space-y-3">
              {vacantUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {unit.property.name} - Unit {unit.unitNumber}
                    </span>
                    <span className="ml-2 text-muted">
                      {unit.bedrooms === 0
                        ? "Studio"
                        : `${unit.bedrooms}bd`}{" "}
                      {unit.sqft?.toLocaleString()} sqft
                    </span>
                  </div>
                  <span className="font-medium text-primary">
                    ${unit.marketRent?.toLocaleString()}/mo
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Prospects */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-secondary dark:text-white">
              Recent Prospects
            </h2>
            <Link
              href="/admin/prospects"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {recentProspects.length === 0 ? (
            <p className="text-sm text-muted">No prospects yet.</p>
          ) : (
            <div className="space-y-3">
              {recentProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-icons text-[16px]">
                        person
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {prospect.firstName} {prospect.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {prospect.desiredBedrooms === 0
                          ? "Studio"
                          : `${prospect.desiredBedrooms}bd`}
                        {prospect.budgetMax &&
                          ` up to $${prospect.budgetMax.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      prospect.status === "INQUIRY"
                        ? "bg-primary/10 text-primary"
                        : prospect.status === "TOUR_SCHEDULED"
                          ? "bg-warning/10 text-warning"
                          : prospect.status === "TOURED"
                            ? "bg-accent/10 text-accent"
                            : "bg-success/10 text-success"
                    }`}
                  >
                    {prospect.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color = "primary",
  href,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  href?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const content = (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4 transition-all hover:shadow-sm hover:border-primary/30">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-icons text-[20px] ${colorClasses[color]}`}>
          {icon}
        </span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-secondary dark:text-white">
        {value}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
