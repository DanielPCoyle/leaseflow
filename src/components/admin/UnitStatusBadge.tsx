import { UnitStatus } from "@/generated/prisma/client";

const statusConfig: Record<
  UnitStatus,
  { label: string; className: string; icon: string }
> = {
  VACANT: {
    label: "Vacant",
    className: "bg-success/10 text-success",
    icon: "check_circle",
  },
  OCCUPIED: {
    label: "Occupied",
    className: "bg-primary/10 text-primary",
    icon: "person",
  },
  NOTICE_GIVEN: {
    label: "Notice Given",
    className: "bg-warning/10 text-warning",
    icon: "schedule",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-danger/10 text-danger",
    icon: "build",
  },
  MODEL: {
    label: "Model",
    className: "bg-accent/10 text-accent",
    icon: "visibility",
  },
  OFFLINE: {
    label: "Offline",
    className: "bg-muted/10 text-muted",
    icon: "block",
  },
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span className="material-icons text-[12px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
