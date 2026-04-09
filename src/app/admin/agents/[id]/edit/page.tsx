import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AgentEditForm } from "@/components/admin/AgentEditForm";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const [agent, properties] = await Promise.all([
    prisma.agent.findFirst({
      where: { id, companyId: session.user.companyId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        agentProperties: { select: { propertyId: true } },
      },
    }),
    prisma.property.findMany({
      where: { companyId: session.user.companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!agent) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        Edit {agent.user.name}
      </h1>
      <AgentEditForm
        agent={{
          id: agent.id,
          name: agent.user.name || "",
          phone: agent.user.phone || "",
          title: agent.title || "",
          transportMode: agent.transportMode,
          bufferMinutes: agent.bufferMinutes,
          propertyIds: agent.agentProperties.map((ap) => ap.propertyId),
        }}
        properties={properties}
      />
    </div>
  );
}
