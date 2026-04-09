import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function BookingListPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; bedrooms?: string; maxPrice?: string }>;
}) {
  const filters = await searchParams;
  const companySlug = filters.company || "alterra"; // Default to seed client

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, logoUrl: true, portfolioBrowsingEnabled: true },
  });

  if (!company) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <span className="material-icons text-[48px] text-muted/30">search_off</span>
        <h1 className="mt-4 text-xl font-bold">Company not found</h1>
      </div>
    );
  }

  const propertyWhere: Record<string, unknown> = {
    companyId: company.id,
    isActive: true,
  };

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    include: {
      region: { select: { name: true } },
      amenities: { take: 4 },
      floorPlans: {
        where: { isActive: true },
        select: { bedrooms: true, basePrice: true },
      },
      units: {
        where: {
          status: "VACANT",
          isActive: true,
          ...(filters.bedrooms ? { bedrooms: parseInt(filters.bedrooms) } : {}),
          ...(filters.maxPrice ? { marketRent: { lte: parseFloat(filters.maxPrice) } } : {}),
        },
        select: { id: true, bedrooms: true, marketRent: true },
      },
      _count: {
        select: { units: { where: { status: "VACANT", isActive: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const filtered = (filters.bedrooms || filters.maxPrice)
    ? properties.filter((p) => p.units.length > 0)
    : properties;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary dark:text-white">
          {company.name} Apartments
        </h1>
        <p className="mt-1 text-muted">
          Browse {filtered.length} properties and find your new home.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <FilterLink
          href={`/book?company=${companySlug}`}
          active={!filters.bedrooms && !filters.maxPrice}
          label="All"
        />
        {[
          { bedrooms: "0", label: "Studio" },
          { bedrooms: "1", label: "1 Bed" },
          { bedrooms: "2", label: "2 Bed" },
          { bedrooms: "3", label: "3+ Bed" },
        ].map((f) => (
          <FilterLink
            key={f.bedrooms}
            href={`/book?company=${companySlug}&bedrooms=${f.bedrooms}${filters.maxPrice ? `&maxPrice=${filters.maxPrice}` : ""}`}
            active={filters.bedrooms === f.bedrooms}
            label={f.label}
          />
        ))}
        <span className="border-l border-border mx-1" />
        {[
          { price: "2000", label: "Under $2k" },
          { price: "3000", label: "Under $3k" },
          { price: "5000", label: "Under $5k" },
        ].map((f) => (
          <FilterLink
            key={f.price}
            href={`/book?company=${companySlug}&maxPrice=${f.price}${filters.bedrooms ? `&bedrooms=${filters.bedrooms}` : ""}`}
            active={filters.maxPrice === f.price}
            label={f.label}
          />
        ))}
      </div>

      {/* Property Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((property) => {
          const prices = [
            ...property.floorPlans.map((fp) => fp.basePrice),
            ...property.units.map((u) => u.marketRent).filter(Boolean) as number[],
          ];
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const maxBed = property.floorPlans.length > 0
            ? Math.max(...property.floorPlans.map((fp) => fp.bedrooms))
            : null;
          const petPolicy = property.petPolicy as { allowed?: boolean } | null;

          return (
            <Link
              key={property.id}
              href={`/book/${property.slug}?company=${companySlug}`}
              className="group overflow-hidden rounded-xl border border-border bg-white dark:bg-secondary transition-all hover:shadow-lg hover:border-primary/30"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="material-icons text-[48px] text-primary/30">apartment</span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-secondary dark:text-white group-hover:text-primary transition-colors">
                    {property.name}
                  </h3>
                  {property._count.units > 0 && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      {property._count.units} available
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted mb-3">
                  {property.address}, {property.city}, {property.state}
                </p>

                {property.region && (
                  <p className="text-xs text-muted mb-3 flex items-center gap-1">
                    <span className="material-icons text-[14px]">location_on</span>
                    {property.region.name}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm mb-3">
                  {minPrice && (
                    <span className="font-semibold text-primary">
                      From ${minPrice.toLocaleString()}/mo
                    </span>
                  )}
                  {maxBed !== null && (
                    <span className="text-muted">
                      Studio{maxBed > 0 ? ` - ${maxBed}BR` : ""}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {property.amenities.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      className="flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-muted"
                    >
                      {a.icon && (
                        <span className="material-icons text-[12px]">{a.icon}</span>
                      )}
                      {a.name}
                    </span>
                  ))}
                  {petPolicy?.allowed && (
                    <span className="flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-muted">
                      <span className="material-icons text-[12px]">pets</span>
                      Pet Friendly
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <span className="material-icons text-[48px] text-muted/30">search_off</span>
          <h2 className="mt-4 text-lg font-semibold">No matching properties</h2>
          <p className="text-sm text-muted mt-1">Try adjusting your filters.</p>
          <Link
            href={`/book?company=${companySlug}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border text-muted hover:text-foreground hover:border-primary/30"
      }`}
    >
      {label}
    </Link>
  );
}
