import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: "Draft", color: "bg-muted/10 text-muted", icon: "edit" },
  PENDING_SIGNATURE: { label: "Pending Signature", color: "bg-warning/10 text-warning", icon: "draw" },
  ACTIVE: { label: "Active", color: "bg-success/10 text-success", icon: "check_circle" },
  EXPIRING_SOON: { label: "Expiring Soon", color: "bg-warning/10 text-warning", icon: "schedule" },
  MONTH_TO_MONTH: { label: "Month to Month", color: "bg-accent/10 text-accent", icon: "autorenew" },
  TERMINATED: { label: "Terminated", color: "bg-danger/10 text-danger", icon: "cancel" },
  EXPIRED: { label: "Expired", color: "bg-muted/10 text-muted", icon: "event_busy" },
};

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const filters = await searchParams;
  const companyId = session.user.companyId;

  const where: Record<string, unknown> = { companyId };
  if (filters.status) where.status = filters.status;

  const [leases, statusCounts] = await Promise.all([
    prisma.lease.findMany({
      where,
      include: {
        unit: {
          select: {
            unitNumber: true, bedrooms: true,
            property: { select: { id: true, name: true } },
          },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.lease.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
  ]);

  const counts = statusCounts.reduce(
    (acc, s) => { acc[s.status] = s._count; return acc; },
    {} as Record<string, number>
  );

  const totalRevenue = leases
    .filter((l) => l.status === "ACTIVE" || l.status === "MONTH_TO_MONTH")
    .reduce((sum, l) => sum + l.monthlyRent, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Leases</h1>
          <p className="text-sm text-muted">
            {leases.length} leases | Active monthly revenue: ${Math.round(totalRevenue).toLocaleString()}
          </p>
        </div>
        <Link
          href="/admin/leases/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">add</span>
          New Lease
        </Link>
      </div>

      {/* Status Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/leases"
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            !filters.status ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
          }`}
        >
          All
        </Link>
        {(["ACTIVE", "PENDING_SIGNATURE", "DRAFT", "EXPIRING_SOON", "MONTH_TO_MONTH", "TERMINATED"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <Link
              key={s}
              href={`/admin/leases?status=${s}`}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                filters.status === s ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
              }`}
            >
              {cfg.label}
              <span className="text-xs">({counts[s] ?? 0})</span>
            </Link>
          );
        })}
      </div>

      {/* Leases Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Property / Unit</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {leases.map((lease) => {
              const cfg = statusConfig[lease.status] || statusConfig.DRAFT;
              const daysLeft = Math.ceil(
                (new Date(lease.leaseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <tr key={lease.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leases/${lease.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {lease.primaryTenantName}
                    </Link>
                    <p className="text-xs text-muted">{lease.primaryTenantEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${lease.unit.property.id}`}
                      className="text-primary hover:underline"
                    >
                      {lease.unit.property.name}
                    </Link>
                    <p className="text-xs text-muted">
                      Unit #{lease.unit.unitNumber} ({lease.unit.bedrooms === 0 ? "Studio" : `${lease.unit.bedrooms}bd`})
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{new Date(lease.leaseStart).toLocaleDateString()} - {new Date(lease.leaseEnd).toLocaleDateString()}</p>
                    {lease.status === "ACTIVE" && daysLeft > 0 && daysLeft <= 90 && (
                      <p className="text-warning">{daysLeft} days remaining</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${lease.monthlyRent.toLocaleString()}/mo
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                      <span className="material-icons text-[12px]">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {lease._count.payments} payments
                  </td>
                </tr>
              );
            })}
            {leases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">No leases found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
