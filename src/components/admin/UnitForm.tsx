"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UnitFormProps {
  propertyId: string;
  propertyName: string;
  floorPlans: {
    id: string; name: string; bedrooms: number;
    bathrooms: number; sqft: number | null; basePrice: number;
  }[];
}

export function UnitForm({ propertyId, propertyName, floorPlans }: UnitFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [floorPlanId, setFloorPlanId] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [sqft, setSqft] = useState("");
  const [marketRent, setMarketRent] = useState("");
  const [status, setStatus] = useState("VACANT");
  const [availableDate, setAvailableDate] = useState("");

  // Auto-fill from floor plan
  useEffect(() => {
    if (floorPlanId) {
      const fp = floorPlans.find((f) => f.id === floorPlanId);
      if (fp) {
        setBedrooms(fp.bedrooms.toString());
        setBathrooms(fp.bathrooms.toString());
        if (fp.sqft) setSqft(fp.sqft.toString());
        setMarketRent(fp.basePrice.toString());
      }
    }
  }, [floorPlanId, floorPlans]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        floorPlanId: floorPlanId || null,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        sqft: sqft ? parseInt(sqft) : null,
        marketRent: marketRent ? parseFloat(marketRent) : null,
        status,
        availableDate: availableDate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create unit");
      setSaving(false);
      return;
    }

    router.push(`/admin/properties/${propertyId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>{error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Unit Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Unit Number *</label>
            <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} required
              placeholder="e.g. 201, PH1"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Floor</label>
            <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        {floorPlans.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Floor Plan</label>
            <select value={floorPlanId} onChange={(e) => setFloorPlanId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">None (custom)</option>
              {floorPlans.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.name} ({fp.bedrooms === 0 ? "Studio" : `${fp.bedrooms}bd`}/{fp.bathrooms}ba - ${fp.basePrice.toLocaleString()}/mo)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Bedrooms *</label>
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              <option value="0">Studio</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Bathrooms *</label>
            <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              <option value="1">1</option>
              <option value="1.5">1.5</option>
              <option value="2">2</option>
              <option value="2.5">2.5</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">SqFt</label>
            <input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Rent ($/mo)</label>
            <input type="number" value={marketRent} onChange={(e) => setMarketRent(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Availability</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="NOTICE_GIVEN">Notice Given</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="MODEL">Model</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Available Date</label>
            <input type="date" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? <span className="material-icons animate-spin text-[18px]">progress_activity</span>
            : <span className="material-icons text-[18px]">add</span>}
          Add Unit
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">Cancel</button>
      </div>
    </form>
  );
}
