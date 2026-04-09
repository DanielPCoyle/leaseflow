import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-primary/10 text-primary", icon: "event" },
  CONFIRMED: { label: "Confirmed", className: "bg-success/10 text-success", icon: "check_circle" },
  IN_PROGRESS: { label: "In Progress", className: "bg-warning/10 text-warning", icon: "directions_run" },
  COMPLETED: { label: "Completed", className: "bg-muted/10 text-muted", icon: "done_all" },
  CANCELLED: { label: "Cancelled", className: "bg-danger/10 text-danger", icon: "cancel" },
  NO_SHOW: { label: "No Show", className: "bg-danger/10 text-danger", icon: "person_off" },
  RESCHEDULED: { label: "Rescheduled", className: "bg-accent/10 text-accent", icon: "update" },
};

export default async function ToursPage({
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

  const [tours, properties, statusCounts] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        agent: { include: { user: { select: { name: true } } } },
        prospect: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ scheduledDate: "desc" }, { scheduledTime: "asc" }],
      take: 100,
    }),
    prisma.property.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.tour.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
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
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Tours</h1>
          <p className="text-sm text-muted">{tours.length} tours</p>
        </div>
        <Link
          href="/admin/tours/schedule"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">add</span>
          Schedule Tour
        </Link>
      </div>

      {/* Status Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/tours"
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            !filters.status ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:text-foreground"
          }`}
        >
          All
        </Link>
        {(["SCHEDULED", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const).map(
          (status) => {
            const config = statusConfig[status];
            return (
              <Link
                key={status}
                href={`/admin/tours?status=${status}${filters.propertyId ? `&propertyId=${filters.propertyId}` : ""}`}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                  filters.status === status
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {config.label}
                <span className="text-xs">({counts[status] ?? 0})</span>
              </Link>
            );
          }
        )}
      </div>

      {/* Tours Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Travel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {tours.map((tour) => {
              const config = statusConfig[tour.status] || statusConfig.SCHEDULED;
              return (
                <tr key={tour.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {new Date(tour.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted">{formatTime(tour.scheduledTime)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tour.prospectName}</p>
                    <p className="text-xs text-muted">{tour.prospectEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${tour.property.id}`}
                      className="text-primary hover:underline"
                    >
                      {tour.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {tour.agent?.user.name || "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted text-xs">
                      <span className="material-icons text-[14px]">
                        {tour.tourType === "VIDEO" ? "videocam" : tour.tourType === "SELF_GUIDED" ? "key" : "person"}
                      </span>
                      {tour.tourType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
                      <span className="material-icons text-[12px]">{config.icon}</span>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {tour.travelTimeFromPrev
                      ? `${tour.travelTimeFromPrev}min`
                      : "-"}
                  </td>
                </tr>
              );
            })}
            {tours.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No tours found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
