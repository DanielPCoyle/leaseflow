import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LeaseActions } from "@/components/admin/LeaseActions";

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-accent/10 text-accent",
  SUCCEEDED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
  REFUNDED: "bg-muted/10 text-muted",
};

const paymentTypeLabels: Record<string, string> = {
  RENT: "Rent",
  SECURITY_DEPOSIT: "Security Deposit",
  APPLICATION_FEE: "Application Fee",
  MOVE_IN_FEE: "Move-in Fee",
  PET_DEPOSIT: "Pet Deposit",
  PET_RENT: "Pet Rent",
  LATE_FEE: "Late Fee",
  UTILITY: "Utility",
  OTHER: "Other",
};

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const lease = await prisma.lease.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      unit: {
        select: {
          id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, floor: true,
          property: { select: { id: true, name: true, address: true, city: true, state: true, zip: true } },
        },
      },
      application: {
        select: { id: true, firstName: true, lastName: true, prospectId: true },
      },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!lease) notFound();

  const daysLeft = Math.ceil(
    (new Date(lease.leaseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const totalPaid = lease.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDue = lease.payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/leases"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[18px]">arrow_back</span>
          Leases
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary dark:text-white">
              {lease.primaryTenantName}
            </h1>
            <p className="text-sm text-muted">
              {lease.unit.property.name} - Unit #{lease.unit.unitNumber}
            </p>
          </div>
          <LeaseActions leaseId={lease.id} currentStatus={lease.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Lease Terms */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-4 font-semibold text-secondary dark:text-white">Lease Terms</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-muted">Lease Period</p>
                <p className="font-medium">
                  {new Date(lease.leaseStart).toLocaleDateString()} - {new Date(lease.leaseEnd).toLocaleDateString()}
                </p>
                {lease.leaseTerm && <p className="text-xs text-muted">{lease.leaseTerm} months</p>}
              </div>
              <div>
                <p className="text-xs text-muted">Monthly Rent</p>
                <p className="text-xl font-bold text-primary">${lease.monthlyRent.toLocaleString()}</p>
              </div>
              {lease.securityDeposit && (
                <div>
                  <p className="text-xs text-muted">Security Deposit</p>
                  <p>${lease.securityDeposit.toLocaleString()}</p>
                </div>
              )}
              {lease.moveInFee && (
                <div>
                  <p className="text-xs text-muted">Move-in Fee</p>
                  <p>${lease.moveInFee.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted">Status</p>
                <p className="font-medium">{lease.status.replace(/_/g, " ")}</p>
              </div>
              {lease.status === "ACTIVE" && (
                <div>
                  <p className="text-xs text-muted">Time Remaining</p>
                  <p className={daysLeft <= 90 ? "text-warning font-medium" : ""}>
                    {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                  </p>
                </div>
              )}
            </div>

            {/* Renewal */}
            {lease.status === "ACTIVE" && daysLeft <= 90 && daysLeft > 0 && (
              <div className="mt-4 rounded-lg bg-warning/5 border border-warning/20 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-icons text-warning text-[18px]">notification_important</span>
                  <span className="font-medium text-warning">
                    Lease expires in {daysLeft} days
                    {!lease.renewalOffered && " - Renewal not yet offered"}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Payment Ledger */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-secondary dark:text-white">Payment Ledger</h2>
              <div className="flex gap-4 text-sm">
                <span className="text-success">Paid: ${totalPaid.toLocaleString()}</span>
                {totalDue > 0 && <span className="text-warning">Due: ${totalDue.toLocaleString()}</span>}
              </div>
            </div>

            {lease.payments.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No payments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2 pr-4">Due Date</th>
                      <th className="pb-2 pr-4">Paid</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lease.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-2.5 pr-4">
                          {paymentTypeLabels[payment.type] || payment.type}
                          {payment.description && (
                            <p className="text-xs text-muted">{payment.description}</p>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 font-medium">${payment.amount.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-muted">
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2.5 pr-4 text-muted">
                          {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            paymentStatusColors[payment.status] || ""
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Tenant</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{lease.primaryTenantName}</p>
              <div className="flex items-center gap-2">
                <span className="material-icons text-[16px] text-muted">email</span>
                <a href={`mailto:${lease.primaryTenantEmail}`} className="text-primary hover:underline">
                  {lease.primaryTenantEmail}
                </a>
              </div>
              {lease.primaryTenantPhone && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[16px] text-muted">phone</span>
                  {lease.primaryTenantPhone}
                </div>
              )}
            </div>
            {lease.application && (
              <Link
                href={`/admin/applications/${lease.application.id}`}
                className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <span className="material-icons text-[14px]">description</span>
                View Application
              </Link>
            )}
          </section>

          {/* Unit */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Unit</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Property</span>
                <Link href={`/admin/properties/${lease.unit.property.id}`} className="text-primary hover:underline">
                  {lease.unit.property.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Unit</span>
                <span>#{lease.unit.unitNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Layout</span>
                <span>
                  {lease.unit.bedrooms === 0 ? "Studio" : `${lease.unit.bedrooms}bd`} / {lease.unit.bathrooms}ba
                </span>
              </div>
              {lease.unit.sqft && (
                <div className="flex justify-between">
                  <span className="text-muted">Size</span>
                  <span>{lease.unit.sqft.toLocaleString()} sqft</span>
                </div>
              )}
              {lease.unit.floor && (
                <div className="flex justify-between">
                  <span className="text-muted">Floor</span>
                  <span>{lease.unit.floor}</span>
                </div>
              )}
            </div>
          </section>

          {/* Document */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Lease Document</h2>
            {lease.leaseDocumentUrl ? (
              <a
                href={lease.leaseDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-icons text-[18px]">description</span>
                View Lease Document
              </a>
            ) : (
              <p className="text-sm text-muted">No document uploaded yet.</p>
            )}
            {lease.signedAt && (
              <p className="text-xs text-muted mt-2">
                Signed {new Date(lease.signedAt).toLocaleDateString()}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
