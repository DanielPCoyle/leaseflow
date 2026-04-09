"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface UnitsFilterProps {
  properties: { id: string; name: string }[];
  currentPropertyId?: string;
  currentStatus?: string;
  currentBedrooms?: string;
}

export function UnitsFilter({
  properties,
  currentPropertyId,
  currentBedrooms,
}: UnitsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/units?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={currentPropertyId || ""}
        onChange={(e) => updateFilter("propertyId", e.target.value)}
        className="rounded-lg border border-border bg-white dark:bg-secondary px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="">All Properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={currentBedrooms || ""}
        onChange={(e) => updateFilter("bedrooms", e.target.value)}
        className="rounded-lg border border-border bg-white dark:bg-secondary px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="">All Bedrooms</option>
        <option value="0">Studio</option>
        <option value="1">1 Bedroom</option>
        <option value="2">2 Bedrooms</option>
        <option value="3">3+ Bedrooms</option>
      </select>

      {(currentPropertyId || currentBedrooms) && (
        <button
          onClick={() => router.push("/admin/units")}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[16px]">close</span>
          Clear filters
        </button>
      )}
    </div>
  );
}
