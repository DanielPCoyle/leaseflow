import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ListingSyncManager } from "@/components/admin/ListingSyncManager";

const platforms = [
  { id: "zillow", name: "Zillow", icon: "home" },
  { id: "apartments_com", name: "Apartments.com", icon: "apartment" },
  { id: "rent_com", name: "Rent.com", icon: "house" },
  { id: "realtor_com", name: "Realtor.com", icon: "real_estate_agent" },
  { id: "hotpads", name: "HotPads", icon: "location_on" },
];

export default async function ListingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const [properties, listings] = await Promise.all([
    prisma.property.findMany({
      where: { companyId: session.user.companyId, isActive: true },
      select: {
        id: true, name: true,
        _count: { select: { units: { where: { status: "VACANT" } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.listing.findMany({
      where: { property: { companyId: session.user.companyId } },
      include: { property: { select: { id: true, name: true } } },
      orderBy: [{ property: { name: "asc" } }, { platform: "asc" }],
    }),
  ]);

  // Build matrix: property x platform
  const matrix = properties.map((p) => ({
    property: p,
    platforms: platforms.map((plat) => {
      const listing = listings.find(
        (l) => l.propertyId === p.id && l.platform === plat.id
      );
      return {
        ...plat,
        listing,
      };
    }),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">ILS Syndication</h1>
        <p className="text-sm text-muted">
          Manage listings across rental platforms. Active listings sync available units automatically.
        </p>
      </div>

      {/* Syndication Matrix */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs font-medium uppercase text-muted">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3 text-center">Vacant</th>
              {platforms.map((p) => (
                <th key={p.id} className="px-4 py-3 text-center">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white dark:bg-secondary">
            {matrix.map((row) => (
              <tr key={row.property.id}>
                <td className="px-4 py-3 font-medium">{row.property.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium">
                    {row.property._count.units}
                  </span>
                </td>
                {row.platforms.map((plat) => (
                  <td key={plat.id} className="px-4 py-3 text-center">
                    <ListingSyncManager
                      propertyId={row.property.id}
                      platform={plat.id}
                      listing={plat.listing ? {
                        id: plat.listing.id,
                        status: plat.listing.status,
                        lastSyncAt: plat.listing.lastSyncAt?.toISOString() || null,
                        syncError: plat.listing.syncError,
                      } : null}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feed URLs */}
      <section className="mt-6 rounded-xl border border-border bg-white dark:bg-secondary p-5">
        <h2 className="mb-3 font-semibold text-secondary dark:text-white flex items-center gap-2">
          <span className="material-icons text-primary text-[20px]">rss_feed</span>
          Feed URLs
        </h2>
        <p className="text-sm text-muted mb-3">
          Share these URLs with listing platforms for automatic data syndication.
        </p>
        <div className="space-y-2">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium min-w-[150px]">{p.name}</span>
              <code className="flex-1 rounded bg-surface px-3 py-1.5 text-xs text-muted font-mono">
                /api/public/listings/{p.id}/feed
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
