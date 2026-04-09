import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: "Draft", color: "bg-muted/10 text-muted", icon: "edit" },
  SUBMITTED: { label: "Submitted", color: "bg-primary/10 text-primary", icon: "inbox" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-warning/10 text-warning", icon: "visibility" },
  SCREENING: { label: "Screening", color: "bg-accent/10 text-accent", icon: "fact_check" },
  APPROVED: { label: "Approved", color: "bg-success/10 text-success", icon: "check_circle" },
  DENIED: { label: "Denied", color: "bg-danger/10 text-danger", icon: "cancel" },
  CANCELLED: { label: "Cancelled", color: "bg-muted/10 text-muted", icon: "close" },
  WAITLISTED: { label: "Waitlisted", color: "bg-warning/10 text-warning", icon: "hourglass_empty" },
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; propertyId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const filters = await searchParams;
  const companyId = session.user.companyId;

  const where: Record<string, unknown> = {
    property: { companyId },
  };
  if (filters.status) where.status = filters.status;
  if (filters.propertyId) where.propertyId = filters.propertyId;

  const [applications, statusCounts, properties] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { unitNumber: true, marketRent: true } },
        prospect: { select: { firstName: true, lastName: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
    }),
    prisma.property.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const counts = statusCounts.reduce(
    (acc, s) => { acc[s.status] = s._count; return acc; },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Applications</h1>
          <p className="text-sm text-muted">{applications.length} applications</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/applications"
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            !filters.status ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
          }`}
        >
          All
        </Link>
        {(["SUBMITTED", "UNDER_REVIEW", "SCREENING", "APPROVED", "DENIED"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <Link
              key={s}
              href={`/admin/applications?status=${s}`}
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

      {/* Property Filter */}
      {properties.length > 1 && (
        <div className="mb-4">
          <select
            defaultValue={filters.propertyId || ""}
            onChange={(e) => {
              const val = e.target.value;
              window.location.href = val
                ? `/admin/applications?propertyId=${val}${filters.status ? `&status=${filters.status}` : ""}`
                : `/admin/applications${filters.status ? `?status=${filters.status}` : ""}`;
            }}
            className="rounded-lg border border-border bg-white dark:bg-secondary px-3 py-2 text-sm"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Income</th>
              <th className="px-4 py-3">Docs</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {applications.map((app) => {
              const cfg = statusConfig[app.status] || statusConfig.SUBMITTED;
              return (
                <tr key={app.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {app.firstName} {app.lastName}
                    </Link>
                    <p className="text-xs text-muted">{app.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${app.property.id}`}
                      className="text-primary hover:underline"
                    >
                      {app.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {app.unit ? `#${app.unit.unitNumber} ($${app.unit.marketRent?.toLocaleString()})` : "Any"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {app.monthlyIncome ? `$${app.monthlyIncome.toLocaleString()}/mo` : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {app._count.documents > 0 ? (
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-[14px]">attach_file</span>
                        {app._count.documents}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                      <span className="material-icons text-[12px]">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
