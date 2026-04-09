import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AgentCalendar } from "@/components/admin/AgentCalendar";

const transportLabels: Record<string, { icon: string; label: string }> = {
  CAR: { icon: "directions_car", label: "Car" },
  TRANSIT: { icon: "directions_transit", label: "Public Transit" },
  BIKE: { icon: "directions_bike", label: "Bicycle" },
  WALK: { icon: "directions_walk", label: "Walking" },
};

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      user: { select: { name: true, email: true, role: true, phone: true } },
      agentProperties: {
        include: {
          property: {
            select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true },
          },
        },
      },
      tours: {
        where: {
          scheduledDate: { gte: new Date() },
          status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
        },
        include: {
          property: { select: { name: true, latitude: true, longitude: true } },
        },
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
        take: 50,
      },
      tourSlots: { where: { isActive: true }, orderBy: { startTime: "asc" } },
    },
  });

  if (!agent) notFound();

  const transport = transportLabels[agent.transportMode] || transportLabels.CAR;

  // Compute tour stats
  const completedTours = await prisma.tour.count({
    where: { agentId: agent.id, status: "COMPLETED" },
  });
  const noShows = await prisma.tour.count({
    where: { agentId: agent.id, status: "NO_SHOW" },
  });

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/agents"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[18px]">arrow_back</span>
          Agents
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-icons text-[32px]">person</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary dark:text-white">
                {agent.user.name}
              </h1>
              <p className="text-sm text-muted">
                {agent.title || agent.user.role.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-muted">{agent.user.email}</p>
              {agent.user.phone && (
                <p className="text-sm text-muted">{agent.user.phone}</p>
              )}
            </div>
          </div>
          <Link
            href={`/admin/agents/${agent.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
          >
            <span className="material-icons text-[18px]">edit</span>
            Edit
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-[18px] text-primary">{transport.icon}</span>
            <span className="text-xs text-muted">Transport</span>
          </div>
          <p className="text-lg font-semibold">{transport.label}</p>
          <p className="text-xs text-muted">{agent.bufferMinutes}min buffer</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-[18px] text-primary">apartment</span>
            <span className="text-xs text-muted">Properties</span>
          </div>
          <p className="text-lg font-semibold">{agent.agentProperties.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-[18px] text-success">check_circle</span>
            <span className="text-xs text-muted">Completed Tours</span>
          </div>
          <p className="text-lg font-semibold">{completedTours}</p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-[18px] text-warning">event_busy</span>
            <span className="text-xs text-muted">No-Shows</span>
          </div>
          <p className="text-lg font-semibold">{noShows}</p>
        </div>
      </div>

      {/* Assigned Properties */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-secondary dark:text-white">
          Assigned Properties
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agent.agentProperties.map((ap) => (
            <Link
              key={ap.id}
              href={`/admin/properties/${ap.property.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white dark:bg-secondary p-4 hover:border-primary/30 transition-colors"
            >
              <span className="material-icons text-primary text-[20px]">apartment</span>
              <div>
                <p className="font-medium text-sm">
                  {ap.property.name}
                  {ap.isPrimary && (
                    <span className="ml-2 text-xs text-primary">Primary</span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {ap.property.address}, {ap.property.city}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Calendar */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-secondary dark:text-white">
          Upcoming Schedule
        </h2>
        <AgentCalendar
          tours={agent.tours.map((t) => ({
            id: t.id,
            propertyName: t.property.name,
            prospectName: t.prospectName,
            scheduledDate: t.scheduledDate.toISOString(),
            scheduledTime: t.scheduledTime,
            duration: t.duration,
            status: t.status,
            tourType: t.tourType,
            travelTimeFromPrev: t.travelTimeFromPrev,
          }))}
          agentName={agent.user.name || "Agent"}
        />
      </section>
    </div>
  );
}
