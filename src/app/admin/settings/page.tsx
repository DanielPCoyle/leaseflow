import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: {
      name: true, slug: true, logoUrl: true, website: true,
      phone: true, email: true, address: true, city: true,
      state: true, zip: true, plan: true, unitCount: true,
      portfolioBrowsingEnabled: true, settings: true,
    },
  });

  if (!company) redirect("/login");

  const settings = company.settings as Record<string, unknown> | null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">Settings</h1>
        <p className="text-sm text-muted">Company configuration and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Plan Info */}
        <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-3 font-semibold text-secondary dark:text-white flex items-center gap-2">
            <span className="material-icons text-primary text-[20px]">workspace_premium</span>
            Subscription
          </h2>
          <div className="flex items-center gap-4">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              company.plan === "ENTERPRISE" ? "bg-primary/10 text-primary" :
              company.plan === "PROFESSIONAL" ? "bg-accent/10 text-accent" :
              "bg-surface text-muted"
            }`}>
              {company.plan}
            </span>
            <span className="text-sm text-muted">{company.unitCount} units tracked</span>
          </div>
        </section>

        <SettingsForm
          company={{
            name: company.name,
            slug: company.slug,
            logoUrl: company.logoUrl,
            website: company.website,
            phone: company.phone,
            email: company.email,
            address: company.address,
            city: company.city,
            state: company.state,
            zip: company.zip,
            portfolioBrowsingEnabled: company.portfolioBrowsingEnabled,
          }}
          settings={{
            applicationFee: (settings?.applicationFee as number) ?? 50,
            incomeRequirement: (settings?.incomeRequirement as number) ?? 3,
            defaultLeaseTerm: (settings?.defaultLeaseTerm as number) ?? 12,
            amenityFee: (settings?.amenityFee as number) ?? 0,
          }}
        />
      </div>
    </div>
  );
}
