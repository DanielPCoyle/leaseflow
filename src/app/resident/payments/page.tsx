import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-accent/10 text-accent",
  SUCCEEDED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
  REFUNDED: "bg-muted/10 text-muted",
};

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const lease = await prisma.lease.findFirst({
    where: {
      primaryTenantEmail: session.user.email,
      status: { in: ["ACTIVE", "MONTH_TO_MONTH"] },
    },
    include: {
      payments: { orderBy: { dueDate: "desc" } },
    },
  });

  if (!lease) redirect("/resident");

  const totalPaid = lease.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = lease.payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">Payment History</h1>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <p className="text-xs text-muted">Monthly Rent</p>
          <p className="text-xl font-bold text-primary">${lease.monthlyRent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <p className="text-xs text-muted">Total Paid</p>
          <p className="text-xl font-bold text-success">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <p className="text-xs text-muted">Balance Due</p>
          <p className={`text-xl font-bold ${totalPending > 0 ? "text-warning" : "text-success"}`}>
            ${totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment List */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {lease.payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.type.replace(/_/g, " ")}</p>
                  {p.description && <p className="text-xs text-muted">{p.description}</p>}
                </td>
                <td className="px-4 py-3 font-medium">${p.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-muted">
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {lease.payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">No payments recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
