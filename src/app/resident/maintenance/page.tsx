import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-primary/10 text-primary",
  ASSIGNED: "bg-accent/10 text-accent",
  IN_PROGRESS: "bg-warning/10 text-warning",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-muted/10 text-muted",
};

export default async function MaintenancePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const lease = await prisma.lease.findFirst({
    where: {
      primaryTenantEmail: session.user.email,
      status: { in: ["ACTIVE", "MONTH_TO_MONTH"] },
    },
    select: { id: true },
  });

  if (!lease) redirect("/resident");

  const requests = await prisma.maintenanceRequest.findMany({
    where: { leaseId: lease.id },
    orderBy: { createdAt: "desc" },
  });

  const open = requests.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED");
  const closed = requests.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">Maintenance Requests</h1>
        <Link
          href="/resident/maintenance/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">add</span>
          New Request
        </Link>
      </div>

      {/* Open Requests */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted uppercase">Open ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted rounded-xl border border-border bg-white dark:bg-secondary p-6 text-center">
            No open requests.
          </p>
        ) : (
          <div className="space-y-3">
            {open.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-sm text-muted mt-0.5">{r.description}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[14px]">category</span>
                    {r.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[14px]">flag</span>
                    {r.priority}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[14px]">schedule</span>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  {r.assignedTo && (
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">person</span>
                      {r.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Closed Requests */}
      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted uppercase">Completed ({closed.length})</h2>
          <div className="space-y-2">
            {closed.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-white dark:bg-secondary p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{r.title}</h3>
                    <p className="text-xs text-muted">{r.category} - {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
