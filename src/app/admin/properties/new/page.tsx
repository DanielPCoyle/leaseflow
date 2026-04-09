import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/admin/PropertyForm";

export default async function NewPropertyPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const regions = await prisma.region.findMany({
    where: { companyId: session.user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        Add Property
      </h1>
      <PropertyForm regions={regions} />
    </div>
  );
}
