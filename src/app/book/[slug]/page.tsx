import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TourBookingWidget } from "@/components/booking/TourBookingWidget";

export default async function PropertyBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ company?: string }>;
}) {
  const { slug } = await params;
  const { company: companySlug } = await searchParams;

  if (!companySlug) notFound();

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, settings: true },
  });

  if (!company) notFound();

  const property = await prisma.property.findFirst({
    where: { slug, companyId: company.id, isActive: true },
    select: {
      id: true, name: true, slug: true, address: true, city: true,
      state: true, zip: true, description: true, imageUrl: true,
      propertyType: true, yearBuilt: true, totalUnits: true, stories: true,
      phone: true, email: true,
      petPolicy: true, officeHours: true,
      region: { select: { name: true } },
      amenities: {
        select: { id: true, name: true, category: true, icon: true },
        orderBy: { category: "asc" },
      },
      photos: {
        select: { url: true, caption: true, category: true },
        orderBy: { sortOrder: "asc" },
      },
      floorPlans: {
        where: { isActive: true },
        orderBy: { bedrooms: "asc" },
        select: {
          id: true, name: true, bedrooms: true, bathrooms: true,
          sqft: true, basePrice: true, imageUrl: true, modelUrl: true,
          units: {
            where: { status: "VACANT", isActive: true },
            select: {
              id: true, unitNumber: true, floor: true, bedrooms: true,
              bathrooms: true, sqft: true, marketRent: true, availableDate: true,
            },
            orderBy: { marketRent: "asc" },
          },
        },
      },
      units: {
        where: { status: "VACANT", isActive: true, floorPlanId: null },
        select: {
          id: true, unitNumber: true, floor: true, bedrooms: true,
          bathrooms: true, sqft: true, marketRent: true, availableDate: true,
        },
        orderBy: { marketRent: "asc" },
      },
    },
  });

  if (!property) notFound();

  const {
    petPolicy: rawPetPolicy,
    officeHours: rawOfficeHours,
    ...prop
  } = property;
  const petPolicy = rawPetPolicy as {
    allowed?: boolean;
    maxPets?: number;
    weightLimit?: number;
    monthlyRent?: number;
    deposit?: number;
  } | null;
  const officeHours = rawOfficeHours as Record<
    string,
    { open: string; close: string } | null
  > | null;

  // Collect all vacant units
  const allVacantUnits = [
    ...prop.floorPlans.flatMap((fp) =>
      fp.units.map((u) => ({
        id: u.id, unitNumber: u.unitNumber, floor: u.floor,
        bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft,
        marketRent: u.marketRent, availableDate: u.availableDate,
        floorPlanName: fp.name as string | null,
      }))
    ),
    ...prop.units.map((u) => ({
      id: u.id, unitNumber: u.unitNumber, floor: u.floor,
      bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft,
      marketRent: u.marketRent, availableDate: u.availableDate,
      floorPlanName: null as string | null,
    })),
  ];

  type Amenity = { id: string; name: string; category: string; icon: string | null };
  const amenitiesByCategory = prop.amenities.reduce<Record<string, Amenity[]>>(
    (acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Property Header */}
      <div className="mb-8">
        <div className="h-64 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <span className="material-icons text-[64px] text-primary/30">apartment</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary dark:text-white">
              {prop.name}
            </h1>
            <p className="mt-1 text-muted flex items-center gap-1">
              <span className="material-icons text-[16px]">location_on</span>
              {prop.address}, {prop.city}, {prop.state} {prop.zip}
            </p>
            {prop.region && (
              <p className="text-sm text-muted mt-1">{prop.region.name}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {prop.phone && (
              <a
                href={`tel:${prop.phone}`}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface transition-colors"
              >
                <span className="material-icons text-[18px]">phone</span>
                {prop.phone}
              </a>
            )}
            <a
              href="#book-tour"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              <span className="material-icons text-[18px]">calendar_month</span>
              Schedule a Tour
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          {prop.description && (
            <section>
              <h2 className="text-xl font-semibold mb-3 text-secondary dark:text-white">About</h2>
              <p className="text-muted leading-relaxed">{prop.description}</p>
            </section>
          )}

          {/* Available Units */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-secondary dark:text-white">
              Available Units ({allVacantUnits.length})
            </h2>
            {allVacantUnits.length === 0 ? (
              <p className="text-sm text-muted">No units currently available. Schedule a tour to join our waitlist.</p>
            ) : (
              <div className="space-y-3">
                {allVacantUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-white dark:bg-secondary p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="material-icons text-[20px]">door_front</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          Unit {unit.unitNumber}
                          {unit.floorPlanName && (
                            <span className="ml-2 text-sm text-muted">
                              {unit.floorPlanName}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted">
                          {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} Bed`}
                          {" / "}{unit.bathrooms} Bath
                          {unit.sqft && ` / ${unit.sqft.toLocaleString()} sqft`}
                          {unit.floor && ` / Floor ${unit.floor}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-primary text-lg">
                          ${unit.marketRent?.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-muted">
                          {unit.availableDate
                            ? `Available ${new Date(unit.availableDate).toLocaleDateString()}`
                            : "Available now"}
                        </p>
                      </div>
                      <Link
                        href={`/book/${slug}/apply?company=${companySlug}&unitId=${unit.id}`}
                        className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                      >
                        Apply
                        <span className="material-icons text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Floor Plans */}
          {prop.floorPlans.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3 text-secondary dark:text-white">Floor Plans</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {prop.floorPlans.map((fp) => (
                  <div key={fp.id} className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
                    <h3 className="font-medium">{fp.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                      <span>{fp.bedrooms === 0 ? "Studio" : `${fp.bedrooms} Bed`}</span>
                      <span>{fp.bathrooms} Bath</span>
                      {fp.sqft && <span>{fp.sqft.toLocaleString()} sqft</span>}
                    </div>
                    <p className="mt-2 font-semibold text-primary">
                      From ${fp.basePrice.toLocaleString()}/mo
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {fp.units.length} unit{fp.units.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Amenities */}
          {Object.keys(amenitiesByCategory).length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3 text-secondary dark:text-white">Amenities</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {Object.entries(amenitiesByCategory).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="text-sm font-medium text-muted capitalize mb-2">{cat}</h3>
                    <div className="space-y-1.5">
                      {items.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          {a.icon && <span className="material-icons text-[16px] text-primary">{a.icon}</span>}
                          {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pet Policy */}
          {petPolicy?.allowed && (
            <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
              <h2 className="text-lg font-semibold mb-2 text-secondary dark:text-white flex items-center gap-2">
                <span className="material-icons text-primary">pets</span>
                Pet Policy
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted">Max Pets:</span> {petPolicy.maxPets}</div>
                <div><span className="text-muted">Weight Limit:</span> {petPolicy.weightLimit} lbs</div>
                <div><span className="text-muted">Monthly Pet Rent:</span> ${petPolicy.monthlyRent}/pet</div>
                <div><span className="text-muted">One-Time Deposit:</span> ${petPolicy.deposit}</div>
              </div>
            </section>
          )}

          {/* Office Hours */}
          {officeHours && (
            <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
              <h2 className="text-lg font-semibold mb-2 text-secondary dark:text-white flex items-center gap-2">
                <span className="material-icons text-primary">schedule</span>
                Office Hours
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => {
                  const hours = officeHours[day];
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize text-muted">{day}</span>
                      <span>{hours ? `${formatTime(hours.open)} - ${formatTime(hours.close)}` : "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Tour Booking Widget */}
        <div id="book-tour" className="lg:col-span-1">
          <div className="sticky top-6">
            <TourBookingWidget
              propertyId={prop.id}
              propertyName={prop.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
