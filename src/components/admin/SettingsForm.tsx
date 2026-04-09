"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  company: {
    name: string;
    slug: string;
    logoUrl: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    portfolioBrowsingEnabled: boolean;
  };
  settings: {
    applicationFee: number;
    incomeRequirement: number;
    defaultLeaseTerm: number;
    amenityFee: number;
  };
}

export function SettingsForm({ company, settings }: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Company fields
  const [name, setName] = useState(company.name);
  const [phone, setPhone] = useState(company.phone || "");
  const [email, setEmail] = useState(company.email || "");
  const [website, setWebsite] = useState(company.website || "");
  const [address, setAddress] = useState(company.address || "");
  const [city, setCity] = useState(company.city || "");
  const [state, setState] = useState(company.state || "");
  const [zip, setZip] = useState(company.zip || "");
  const [portfolioBrowsing, setPortfolioBrowsing] = useState(company.portfolioBrowsingEnabled);

  // Leasing settings
  const [appFee, setAppFee] = useState(settings.applicationFee);
  const [incomeReq, setIncomeReq] = useState(settings.incomeRequirement);
  const [leaseTerm, setLeaseTerm] = useState(settings.defaultLeaseTerm);
  const [amenityFee, setAmenityFee] = useState(settings.amenityFee);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone: phone || null,
        email: email || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        portfolioBrowsingEnabled: portfolioBrowsing,
        settings: {
          applicationFee: appFee,
          incomeRequirement: incomeReq,
          defaultLeaseTerm: leaseTerm,
          amenityFee: amenityFee,
        },
      }),
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
          <span className="material-icons text-primary text-[20px]">business</span>
          Company Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" value={name} onChange={setName} />
          <Field label="Slug" value={company.slug} onChange={() => {}} disabled />
          <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Website" value={website} onChange={setWebsite} />
          <Field label="Address" value={address} onChange={setAddress} />
          <Field label="City" value={city} onChange={setCity} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="State" value={state} onChange={setState} />
            <Field label="ZIP" value={zip} onChange={setZip} />
          </div>
        </div>
      </section>

      {/* Leasing Settings */}
      <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
          <span className="material-icons text-primary text-[20px]">tune</span>
          Leasing Settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Application Fee ($)</label>
            <input
              type="number"
              value={appFee}
              onChange={(e) => setAppFee(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Income Requirement (x rent)</label>
            <input
              type="number"
              value={incomeReq}
              onChange={(e) => setIncomeReq(Number(e.target.value))}
              step="0.5"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default Lease Term (months)</label>
            <input
              type="number"
              value={leaseTerm}
              onChange={(e) => setLeaseTerm(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Move-in/Amenity Fee ($)</label>
            <input
              type="number"
              value={amenityFee}
              onChange={(e) => setAmenityFee(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Portfolio Browsing */}
      <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-secondary dark:text-white">Portfolio Browsing</h2>
            <p className="text-sm text-muted mt-0.5">
              Allow prospects to browse and search across all your properties
            </p>
          </div>
          <button
            onClick={() => setPortfolioBrowsing(!portfolioBrowsing)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              portfolioBrowsing ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                portfolioBrowsing ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? (
            <span className="material-icons animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-icons text-[18px]">save</span>
          )}
          Save Settings
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <span className="material-icons text-[16px]">check_circle</span>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
      />
    </div>
  );
}
