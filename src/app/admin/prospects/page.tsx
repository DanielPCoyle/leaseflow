import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const pipelineStages = [
  { status: "INQUIRY", label: "Inquiry", icon: "mail", color: "primary" },
  { status: "TOUR_SCHEDULED", label: "Tour Scheduled", icon: "event", color: "warning" },
  { status: "TOURED", label: "Toured", icon: "check_circle", color: "accent" },
  { status: "APPLIED", label: "Applied", icon: "description", color: "primary" },
  { status: "APPROVED", label: "Approved", icon: "verified", color: "success" },
  { status: "LEASE_SENT", label: "Lease Sent", icon: "send", color: "primary" },
  { status: "LEASE_SIGNED", label: "Lease Signed", icon: "handshake", color: "success" },
  { status: "MOVED_IN", label: "Moved In", icon: "home", color: "success" },
  { status: "LOST", label: "Lost", icon: "close", color: "danger" },
] as const;

const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  danger: "bg-danger/10 text-danger",
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const filters = await searchParams;
  const companyId = session.user.companyId;

  const where: Record<string, unknown> = { companyId };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [prospects, statusCounts] = await Promise.all([
    prisma.prospect.findMany({
      where,
      include: {
        _count: { select: { tours: true, applications: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.prospect.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
  ]);

  const counts = statusCounts.reduce(
    (acc, s) => { acc[s.status] = s._count; return acc; },
    {} as Record<string, number>
  );
  const totalProspects = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Prospects</h1>
          <p className="text-sm text-muted">{totalProspects} total prospects in pipeline</p>
        </div>
        <Link
          href="/admin/prospects/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">person_add</span>
          Add Prospect
        </Link>
      </div>

      {/* Pipeline Summary */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          <Link
            href="/admin/prospects"
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              !filters.status ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:text-foreground"
            }`}
          >
            All
            <span className="rounded-full bg-surface px-1.5 text-xs">{totalProspects}</span>
          </Link>
          {pipelineStages.map((stage) => (
            <Link
              key={stage.status}
              href={`/admin/prospects?status=${stage.status}${filters.search ? `&search=${filters.search}` : ""}`}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                filters.status === stage.status
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              <span className="material-icons text-[16px]">{stage.icon}</span>
              {stage.label}
              <span className="rounded-full bg-surface px-1.5 text-xs">
                {counts[stage.status] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-sm">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted">
            search
          </span>
          <input
            type="text"
            name="search"
            defaultValue={filters.search}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-white dark:bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
        </div>
      </form>

      {/* Prospects Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Preferences</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {prospects.map((prospect) => {
              const stage = pipelineStages.find((s) => s.status === prospect.status);
              const stageColor = stage ? colorClasses[stage.color] : colorClasses.primary;

              return (
                <tr key={prospect.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/prospects/${prospect.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {prospect.firstName} {prospect.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-muted">{prospect.email}</p>
                    {prospect.phone && (
                      <p className="text-xs text-muted">{prospect.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {prospect.desiredBedrooms !== null && (
                      <span>
                        {prospect.desiredBedrooms === 0 ? "Studio" : `${prospect.desiredBedrooms}bd`}
                      </span>
                    )}
                    {prospect.budgetMax && (
                      <span className="ml-2">up to ${prospect.budgetMax.toLocaleString()}</span>
                    )}
                    {prospect.hasPets && (
                      <span className="ml-2 inline-flex items-center gap-0.5">
                        <span className="material-icons text-[12px]">pets</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">
                    {prospect.source?.replace("_", " ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColor}`}>
                      {stage && <span className="material-icons text-[12px]">{stage.icon}</span>}
                      {stage?.label || prospect.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {prospect._count.tours > 0 && (
                      <span className="mr-2">{prospect._count.tours} tours</span>
                    )}
                    {prospect._count.applications > 0 && (
                      <span>{prospect._count.applications} apps</span>
                    )}
                    {prospect._count.tours === 0 && prospect._count.applications === 0 && "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(prospect.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {prospects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No prospects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
