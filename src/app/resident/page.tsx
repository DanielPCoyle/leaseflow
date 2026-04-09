import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ResidentDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const lease = await prisma.lease.findFirst({
    where: {
      primaryTenantEmail: session.user.email,
      status: { in: ["ACTIVE", "MONTH_TO_MONTH"] },
    },
    include: {
      unit: {
        select: {
          unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, floor: true,
          property: {
            select: { name: true, address: true, city: true, state: true, zip: true, phone: true },
          },
        },
      },
      payments: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
        take: 3,
      },
      maintenanceRequests: {
        where: { status: { not: "COMPLETED" } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!lease) {
    return (
      <div className="text-center py-16">
        <span className="material-icons text-[48px] text-muted/30">home</span>
        <h1 className="mt-4 text-xl font-bold">No Active Lease</h1>
        <p className="text-sm text-muted mt-2">
          No active lease was found for {session.user.email}.
        </p>
      </div>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(lease.leaseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Welcome, {lease.primaryTenantName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted">
          {lease.unit.property.name} - Unit #{lease.unit.unitNumber}
        </p>
      </div>

      {/* Quick Info */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <span className="material-icons text-primary text-[20px]">apartment</span>
          <p className="mt-1 text-xs text-muted">Unit</p>
          <p className="font-semibold">#{lease.unit.unitNumber}</p>
          <p className="text-xs text-muted">
            {lease.unit.bedrooms === 0 ? "Studio" : `${lease.unit.bedrooms}bd`} / {lease.unit.bathrooms}ba
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <span className="material-icons text-primary text-[20px]">payments</span>
          <p className="mt-1 text-xs text-muted">Monthly Rent</p>
          <p className="font-semibold">${lease.monthlyRent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <span className="material-icons text-primary text-[20px]">calendar_today</span>
          <p className="mt-1 text-xs text-muted">Lease Ends</p>
          <p className="font-semibold">{new Date(lease.leaseEnd).toLocaleDateString()}</p>
          <p className={`text-xs ${daysLeft <= 90 ? "text-warning" : "text-muted"}`}>
            {daysLeft} days
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <span className="material-icons text-primary text-[20px]">location_on</span>
          <p className="mt-1 text-xs text-muted">Property</p>
          <p className="font-semibold text-sm">{lease.unit.property.name}</p>
          {lease.unit.property.phone && (
            <a href={`tel:${lease.unit.property.phone}`} className="text-xs text-primary">
              {lease.unit.property.phone}
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Pending Payments */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-secondary dark:text-white">Upcoming Payments</h2>
            <Link href="/resident/payments" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {lease.payments.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted">
              <span className="material-icons text-[24px] text-success block mb-1">check_circle</span>
              All caught up!
            </div>
          ) : (
            <div className="space-y-2">
              {lease.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface p-3 text-sm">
                  <div>
                    <p className="font-medium">{p.type.replace(/_/g, " ")}</p>
                    {p.dueDate && <p className="text-xs text-muted">Due {new Date(p.dueDate).toLocaleDateString()}</p>}
                  </div>
                  <span className="font-semibold">${p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Open Maintenance */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-secondary dark:text-white">Maintenance Requests</h2>
            <Link href="/resident/maintenance" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {lease.maintenanceRequests.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted">
              <span className="material-icons text-[24px] text-success block mb-1">check_circle</span>
              No open requests
            </div>
          ) : (
            <div className="space-y-2">
              {lease.maintenanceRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-surface p-3 text-sm">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{r.category}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "SUBMITTED" ? "bg-primary/10 text-primary" :
                    r.status === "IN_PROGRESS" ? "bg-warning/10 text-warning" :
                    "bg-muted/10 text-muted"
                  }`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/resident/maintenance/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted hover:border-primary/30 hover:text-primary"
          >
            <span className="material-icons text-[18px]">add</span>
            New Request
          </Link>
        </section>
      </div>
    </div>
  );
}
