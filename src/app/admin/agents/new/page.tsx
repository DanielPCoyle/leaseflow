import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgentForm } from "@/components/admin/AgentForm";

export default async function NewAgentPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const properties = await prisma.property.findMany({
    where: { companyId: session.user.companyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">Add Agent</h1>
      <AgentForm properties={properties} />
    </div>
  );
}
