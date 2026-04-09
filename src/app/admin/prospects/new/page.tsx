"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProspectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [desiredBedrooms, setDesiredBedrooms] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [desiredMoveIn, setDesiredMoveIn] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState("");
  const [source, setSource] = useState("website");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email,
        phone: phone || null,
        desiredBedrooms: desiredBedrooms ? parseInt(desiredBedrooms) : null,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        desiredMoveIn: desiredMoveIn || null,
        hasPets, petDetails: petDetails || null, source,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create prospect");
      setSaving(false);
      return;
    }

    router.push("/admin/prospects");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">Add Prospect</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>{error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
          <h2 className="font-semibold">Contact Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name *" value={firstName} onChange={setFirstName} required />
            <Field label="Last Name *" value={lastName} onChange={setLastName} required />
            <Field label="Email *" value={email} onChange={setEmail} type="email" required />
            <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
          <h2 className="font-semibold">Preferences</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bedrooms</label>
              <select value={desiredBedrooms} onChange={(e) => setDesiredBedrooms(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Any</option>
                <option value="0">Studio</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>
            </div>
            <Field label="Desired Move-in" value={desiredMoveIn} onChange={setDesiredMoveIn} type="date" />
            <Field label="Budget Min ($)" value={budgetMin} onChange={setBudgetMin} type="number" />
            <Field label="Budget Max ($)" value={budgetMax} onChange={setBudgetMax} type="number" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} className="accent-primary" />
              <span className="text-sm">Has Pets</span>
            </label>
            {hasPets && (
              <input type="text" value={petDetails} onChange={(e) => setPetDetails(e.target.value)}
                placeholder="e.g. 1 dog, 30 lbs"
                className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-primary" />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
          <h2 className="font-semibold">Source</h2>
          <div className="flex flex-wrap gap-2">
            {["website", "apartments.com", "zillow", "rent.com", "walk_in", "referral", "phone", "other"].map((s) => (
              <button key={s} type="button" onClick={() => setSource(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                  source === s ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            {saving ? <span className="material-icons animate-spin text-[18px]">progress_activity</span>
              : <span className="material-icons text-[18px]">person_add</span>}
            Add Prospect
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}
