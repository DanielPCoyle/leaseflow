import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScheduleTourForm } from "@/components/admin/ScheduleTourForm";

export default async function ScheduleTourPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const [properties, agents, prospects] = await Promise.all([
    prisma.property.findMany({
      where: { companyId: session.user.companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.agent.findMany({
      where: { companyId: session.user.companyId, isActive: true },
      include: {
        user: { select: { name: true } },
        agentProperties: { select: { propertyId: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.prospect.findMany({
      where: { companyId: session.user.companyId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      orderBy: { lastName: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        Schedule a Tour
      </h1>
      <ScheduleTourForm
        properties={properties}
        agents={agents.map((a) => ({
          id: a.id,
          name: a.user.name || "Agent",
          propertyIds: a.agentProperties.map((ap) => ap.propertyId),
        }))}
        prospects={prospects}
      />
    </div>
  );
}
