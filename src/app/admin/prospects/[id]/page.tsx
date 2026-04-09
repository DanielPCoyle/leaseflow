import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ProspectActions } from "@/components/admin/ProspectActions";

const stageConfig: Record<string, { label: string; icon: string; color: string }> = {
  INQUIRY: { label: "Inquiry", icon: "mail", color: "bg-primary/10 text-primary" },
  TOUR_SCHEDULED: { label: "Tour Scheduled", icon: "event", color: "bg-warning/10 text-warning" },
  TOURED: { label: "Toured", icon: "check_circle", color: "bg-accent/10 text-accent" },
  APPLIED: { label: "Applied", icon: "description", color: "bg-primary/10 text-primary" },
  APPROVED: { label: "Approved", icon: "verified", color: "bg-success/10 text-success" },
  LEASE_SENT: { label: "Lease Sent", icon: "send", color: "bg-primary/10 text-primary" },
  LEASE_SIGNED: { label: "Lease Signed", icon: "handshake", color: "bg-success/10 text-success" },
  MOVED_IN: { label: "Moved In", icon: "home", color: "bg-success/10 text-success" },
  LOST: { label: "Lost", icon: "close", color: "bg-danger/10 text-danger" },
  WAITLIST: { label: "Waitlist", icon: "hourglass_empty", color: "bg-muted/10 text-muted" },
};

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      tours: {
        include: {
          property: { select: { name: true } },
          agent: { include: { user: { select: { name: true } } } },
        },
        orderBy: { scheduledDate: "desc" },
      },
      applications: {
        include: { property: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      communications: {
        orderBy: { sentAt: "desc" },
        take: 50,
      },
      tasks: {
        include: { agent: { include: { user: { select: { name: true } } } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
    },
  });

  if (!prospect) notFound();

  const stage = stageConfig[prospect.status] || stageConfig.INQUIRY;

  // Build timeline from tours + communications
  const timeline = [
    ...prospect.tours.map((t) => ({
      type: "tour" as const,
      date: t.scheduledDate,
      title: `Tour at ${t.property.name}`,
      detail: `${t.status} - ${t.tourType.replace("_", " ")}`,
      icon: "calendar_month",
      agent: t.agent?.user.name,
    })),
    ...prospect.communications.map((c) => ({
      type: "communication" as const,
      date: c.sentAt,
      title: c.subject || `${c.type} ${c.direction.toLowerCase()}`,
      detail: c.body.length > 120 ? c.body.slice(0, 120) + "..." : c.body,
      icon: c.type === "EMAIL" ? "email" : c.type === "SMS" ? "sms" : c.type === "PHONE_CALL" ? "phone" : "chat",
      agent: null,
    })),
    ...prospect.applications.map((a) => ({
      type: "application" as const,
      date: a.createdAt,
      title: `Application for ${a.property.name}`,
      detail: a.status,
      icon: "description",
      agent: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/prospects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[18px]">arrow_back</span>
          Prospects
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-icons text-[32px]">person</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary dark:text-white">
                {prospect.firstName} {prospect.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${stage.color}`}>
                  <span className="material-icons text-[14px]">{stage.icon}</span>
                  {stage.label}
                </span>
                {prospect.source && (
                  <span className="text-xs text-muted capitalize">
                    via {prospect.source.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ProspectActions prospectId={prospect.id} currentStatus={prospect.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Details + Preferences */}
        <div className="space-y-6">
          {/* Contact Info */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[16px] text-muted">email</span>
                <a href={`mailto:${prospect.email}`} className="text-primary hover:underline">
                  {prospect.email}
                </a>
              </div>
              {prospect.phone && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[16px] text-muted">phone</span>
                  <a href={`tel:${prospect.phone}`} className="text-primary hover:underline">
                    {prospect.phone}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Preferences */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Preferences</h2>
            <div className="space-y-2 text-sm">
              {prospect.desiredBedrooms !== null && (
                <div className="flex justify-between">
                  <span className="text-muted">Bedrooms</span>
                  <span>{prospect.desiredBedrooms === 0 ? "Studio" : prospect.desiredBedrooms}</span>
                </div>
              )}
              {prospect.budgetMin !== null && (
                <div className="flex justify-between">
                  <span className="text-muted">Budget</span>
                  <span>
                    ${prospect.budgetMin?.toLocaleString()}
                    {prospect.budgetMax && ` - $${prospect.budgetMax.toLocaleString()}`}
                  </span>
                </div>
              )}
              {prospect.desiredMoveIn && (
                <div className="flex justify-between">
                  <span className="text-muted">Move-in Date</span>
                  <span>{new Date(prospect.desiredMoveIn).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Pets</span>
                <span>{prospect.hasPets ? prospect.petDetails || "Yes" : "No"}</span>
              </div>
            </div>
          </section>

          {/* Tasks */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">
              Tasks ({prospect.tasks.filter((t) => t.status !== "COMPLETED").length} pending)
            </h2>
            {prospect.tasks.length === 0 ? (
              <p className="text-sm text-muted">No tasks assigned.</p>
            ) : (
              <div className="space-y-2">
                {prospect.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                      task.status === "COMPLETED" ? "bg-surface/50 opacity-60" : "bg-surface"
                    }`}
                  >
                    <span className={`material-icons text-[18px] mt-0.5 ${
                      task.status === "COMPLETED" ? "text-success" :
                      task.priority === "URGENT" ? "text-danger" :
                      task.priority === "HIGH" ? "text-warning" : "text-muted"
                    }`}>
                      {task.status === "COMPLETED" ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={task.status === "COMPLETED" ? "line-through" : "font-medium"}>
                        {task.title}
                      </p>
                      {task.agent && (
                        <p className="text-xs text-muted">{task.agent.user.name}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-muted">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-4 font-semibold text-secondary dark:text-white">
              Activity Timeline
            </h2>

            {timeline.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No activity yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="relative flex gap-4 pl-0">
                      <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        item.type === "tour" ? "bg-warning/10 text-warning" :
                        item.type === "application" ? "bg-primary/10 text-primary" :
                        "bg-surface text-muted"
                      }`}>
                        <span className="material-icons text-[18px]">{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted mt-0.5">{item.detail}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span>{new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {item.agent && <span>by {item.agent}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
