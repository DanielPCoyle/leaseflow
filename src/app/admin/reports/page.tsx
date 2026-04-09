import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const companyId = session.user.companyId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    prospectCounts,
    tourCounts,
    appCounts,
    leaseCounts,
    newProspects30d,
    agentStats,
    propertyData,
  ] = await Promise.all([
    prisma.prospect.groupBy({ by: ["status"], where: { companyId }, _count: true }),
    prisma.tour.groupBy({
      by: ["status"],
      where: { property: { companyId }, scheduledDate: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.application.groupBy({ by: ["status"], where: { property: { companyId } }, _count: true }),
    prisma.lease.groupBy({ by: ["status"], where: { companyId }, _count: true }),
    prisma.prospect.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.agent.findMany({
      where: { companyId, isActive: true },
      select: {
        user: { select: { name: true } },
        _count: {
          select: {
            tours: { where: { status: "COMPLETED", scheduledDate: { gte: thirtyDaysAgo } } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.property.findMany({
      where: { companyId },
      select: {
        name: true,
        units: { select: { status: true, marketRent: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const pc = toMap(prospectCounts);
  const tc = toMap(tourCounts);
  const ac = toMap(appCounts);
  const lc = toMap(leaseCounts);

  const totalProspects = sum(pc);
  const totalTours30d = sum(tc);
  const completedTours = tc["COMPLETED"] ?? 0;
  const noShows = tc["NO_SHOW"] ?? 0;
  const totalApps = sum(ac);
  const approvedApps = ac["APPROVED"] ?? 0;
  const activeLeases = (lc["ACTIVE"] ?? 0) + (lc["MONTH_TO_MONTH"] ?? 0);
  const totalRevenue = propertyData.reduce(
    (s, p) => s + p.units.filter((u) => u.status === "OCCUPIED").reduce((rs, u) => rs + (u.marketRent ?? 0), 0), 0
  );

  // Conversion rates
  const tourToApp = completedTours > 0 ? Math.round((totalApps / completedTours) * 100) : 0;
  const appToApprove = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">Reports</h1>
        <p className="text-sm text-muted">Portfolio analytics and performance metrics</p>
      </div>

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="New Prospects (30d)" value={newProspects30d} icon="person_add" />
        <Kpi label="Tours (30d)" value={totalTours30d} icon="calendar_month" />
        <Kpi label="Active Leases" value={activeLeases} icon="handshake" color="success" />
        <Kpi label="Monthly Revenue" value={`$${Math.round(totalRevenue).toLocaleString()}`} icon="payments" color="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-4 font-semibold text-secondary dark:text-white">Leasing Funnel</h2>
          <div className="space-y-3">
            <FunnelBar label="Prospects" count={totalProspects} max={totalProspects} color="bg-primary" />
            <FunnelBar label="Tours Completed" count={completedTours} max={totalProspects} color="bg-accent" />
            <FunnelBar label="Applications" count={totalApps} max={totalProspects} color="bg-warning" />
            <FunnelBar label="Approved" count={approvedApps} max={totalProspects} color="bg-success" />
            <FunnelBar label="Active Leases" count={activeLeases} max={totalProspects} color="bg-success" />
          </div>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-muted">Tour-to-App: </span>
              <span className="font-semibold">{tourToApp}%</span>
            </div>
            <div>
              <span className="text-muted">App Approval: </span>
              <span className="font-semibold">{appToApprove}%</span>
            </div>
            <div>
              <span className="text-muted">No-Show Rate: </span>
              <span className={`font-semibold ${noShows > 0 ? "text-danger" : "text-success"}`}>
                {totalTours30d > 0 ? Math.round((noShows / totalTours30d) * 100) : 0}%
              </span>
            </div>
          </div>
        </section>

        {/* Property Occupancy */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-4 font-semibold text-secondary dark:text-white">Property Occupancy</h2>
          <div className="space-y-3">
            {propertyData.map((p) => {
              const total = p.units.length;
              const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
              const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
              const revenue = p.units
                .filter((u) => u.status === "OCCUPIED")
                .reduce((s, u) => s + (u.marketRent ?? 0), 0);

              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{p.name}</span>
                    <span className="text-muted">
                      {occupied}/{total} ({rate}%) - ${Math.round(revenue).toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate > 90 ? "bg-success" : rate > 70 ? "bg-primary" : rate > 50 ? "bg-warning" : "bg-danger"
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Agent Performance */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-4 font-semibold text-secondary dark:text-white">Agent Performance (30d)</h2>
          {agentStats.length === 0 ? (
            <p className="text-sm text-muted">No agent data.</p>
          ) : (
            <div className="space-y-3">
              {agentStats
                .sort((a, b) => b._count.tours - a._count.tours)
                .map((agent) => {
                  const maxTours = Math.max(...agentStats.map((a) => a._count.tours), 1);
                  return (
                    <div key={agent.user.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{agent.user.name}</span>
                        <span className="text-muted">{agent._count.tours} tours completed</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(agent._count.tours / maxTours) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Pipeline Breakdown */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-4 font-semibold text-secondary dark:text-white">Prospect Pipeline</h2>
          <div className="space-y-2">
            {[
              { label: "Inquiry", count: pc["INQUIRY"] ?? 0, color: "bg-primary" },
              { label: "Tour Scheduled", count: pc["TOUR_SCHEDULED"] ?? 0, color: "bg-warning" },
              { label: "Toured", count: pc["TOURED"] ?? 0, color: "bg-accent" },
              { label: "Applied", count: pc["APPLIED"] ?? 0, color: "bg-primary" },
              { label: "Approved", count: pc["APPROVED"] ?? 0, color: "bg-success" },
              { label: "Lease Signed", count: pc["LEASE_SIGNED"] ?? 0, color: "bg-success" },
              { label: "Moved In", count: pc["MOVED_IN"] ?? 0, color: "bg-success" },
              { label: "Lost", count: pc["LOST"] ?? 0, color: "bg-danger" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, color = "primary" }: {
  label: string; value: string | number; icon: string; color?: string;
}) {
  const colors: Record<string, string> = {
    primary: "text-primary", success: "text-success", warning: "text-warning",
  };
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-icons text-[20px] ${colors[color]}`}>{icon}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-secondary dark:text-white">{value}</p>
    </div>
  );
}

function FunnelBar({ label, count, max, color }: {
  label: string; count: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 2) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-3 rounded-full bg-surface overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function toMap(arr: { status: string; _count: number }[]): Record<string, number> {
  return arr.reduce((acc, s) => { acc[s.status] = s._count; return acc; }, {} as Record<string, number>);
}

function sum(map: Record<string, number>): number {
  return Object.values(map).reduce((a, b) => a + b, 0);
}
