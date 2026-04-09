import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const transportIcons: Record<string, string> = {
  CAR: "directions_car",
  TRANSIT: "directions_transit",
  BIKE: "directions_bike",
  WALK: "directions_walk",
};

export default async function AgentsPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { companyId: session.user.companyId },
    include: {
      user: { select: { name: true, email: true, role: true, isActive: true } },
      agentProperties: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          tours: { where: { status: { in: ["SCHEDULED", "CONFIRMED"] } } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Agents</h1>
          <p className="text-sm text-muted">{agents.length} team members</p>
        </div>
        <Link
          href="/admin/agents/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <span className="material-icons text-[18px]">person_add</span>
          Add Agent
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/admin/agents/${agent.id}`}
            className="group rounded-xl border border-border bg-white dark:bg-secondary p-5 transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-icons text-[24px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-secondary dark:text-white group-hover:text-primary truncate">
                  {agent.user.name}
                </h3>
                <p className="text-sm text-muted">{agent.title || agent.user.role.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted truncate">{agent.user.email}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                agent.user.isActive ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
              }`}>
                {agent.user.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Transport & Buffer */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <span className="material-icons text-[16px]">
                  {transportIcons[agent.transportMode] || "directions_car"}
                </span>
                {agent.transportMode.charAt(0) + agent.transportMode.slice(1).toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-icons text-[16px]">timer</span>
                {agent.bufferMinutes}min buffer
              </span>
              <span className="flex items-center gap-1">
                <span className="material-icons text-[16px]">event</span>
                {agent._count.tours} upcoming
              </span>
            </div>

            {/* Assigned Properties */}
            <div className="mt-3">
              <p className="text-xs text-muted mb-1">
                {agent.agentProperties.length} properties assigned
              </p>
              <div className="flex flex-wrap gap-1.5">
                {agent.agentProperties.map((ap) => (
                  <span
                    key={ap.id}
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      ap.isPrimary
                        ? "bg-primary/10 text-primary font-medium"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {ap.property.name}
                    {ap.isPrimary && " (primary)"}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
