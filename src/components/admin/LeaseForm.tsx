"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeaseFormProps {
  units: { id: string; label: string; marketRent: number | null }[];
  applications: { id: string; label: string; name: string; email: string; phone: string; unitId: string | null }[];
}

export function LeaseForm({ units, applications }: LeaseFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [applicationId, setApplicationId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [moveInFee, setMoveInFee] = useState("350");
  const [leaseTerm, setLeaseTerm] = useState("12");

  // Auto-fill from application
  useEffect(() => {
    if (applicationId) {
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        setTenantName(app.name);
        setTenantEmail(app.email);
        setTenantPhone(app.phone);
        if (app.unitId) setUnitId(app.unitId);
      }
    }
  }, [applicationId, applications]);

  // Auto-fill rent from unit
  useEffect(() => {
    if (unitId) {
      const unit = units.find((u) => u.id === unitId);
      if (unit?.marketRent) setMonthlyRent(unit.marketRent.toString());
    }
  }, [unitId, units]);

  // Auto-calculate end date
  useEffect(() => {
    if (leaseStart && leaseTerm) {
      const start = new Date(leaseStart);
      start.setMonth(start.getMonth() + parseInt(leaseTerm));
      setLeaseEnd(start.toISOString().split("T")[0]);
    }
  }, [leaseStart, leaseTerm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: applicationId || undefined,
        unitId, primaryTenantName: tenantName, primaryTenantEmail: tenantEmail,
        primaryTenantPhone: tenantPhone || null,
        leaseStart, leaseEnd, monthlyRent, leaseTerm,
        securityDeposit: securityDeposit || null,
        moveInFee: moveInFee || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create lease");
      setSaving(false);
      return;
    }

    const lease = await res.json();
    router.push(`/admin/leases/${lease.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>{error}
        </div>
      )}

      {applications.length > 0 && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
          <h2 className="font-semibold">From Approved Application (optional)</h2>
          <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Select application...</option>
            {applications.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Tenant</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name *</label>
            <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email *</label>
            <input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <input type="tel" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Unit & Terms</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Unit *</label>
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} required
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Select unit...</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Lease Start *</label>
            <input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Term (months)</label>
            <select value={leaseTerm} onChange={(e) => setLeaseTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              {[3, 6, 9, 12, 15, 18, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Lease End</label>
            <input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Monthly Rent *</label>
            <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Security Deposit</label>
            <input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Move-in Fee</label>
            <input type="number" value={moveInFee} onChange={(e) => setMoveInFee(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? <span className="material-icons animate-spin text-[18px]">progress_activity</span>
            : <span className="material-icons text-[18px]">handshake</span>}
          Create Lease
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">Cancel</button>
      </div>
    </form>
  );
}
