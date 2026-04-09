"use client";

import { useState, useMemo } from "react";

interface CalendarTour {
  id: string;
  propertyName: string;
  prospectName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: string;
  tourType: string;
  travelTimeFromPrev: number | null;
}

interface AgentCalendarProps {
  tours: CalendarTour[];
  agentName: string;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "border-l-primary bg-primary/5",
  CONFIRMED: "border-l-success bg-success/5",
  IN_PROGRESS: "border-l-warning bg-warning/5",
  COMPLETED: "border-l-muted bg-muted/5",
  CANCELLED: "border-l-danger bg-danger/5",
  NO_SHOW: "border-l-danger bg-danger/5",
};

const tourTypeIcons: Record<string, string> = {
  IN_PERSON: "person",
  VIDEO: "videocam",
  SELF_GUIDED: "key",
};

export function AgentCalendar({ tours, agentName }: AgentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });

  // Group tours by date
  const toursByDate = useMemo(() => {
    const groups: Record<string, CalendarTour[]> = {};
    tours.forEach((t) => {
      const date = t.scheduledDate.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    // Sort each day's tours by time
    Object.values(groups).forEach((dayTours) => {
      dayTours.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    });
    return groups;
  }, [tours]);

  // Get unique dates with tours for the date picker
  const datesWithTours = Object.keys(toursByDate).sort();

  // Get tours for selected date
  const dayTours = toursByDate[selectedDate] || [];

  // Generate week view dates
  const weekDates = useMemo(() => {
    const start = new Date(selectedDate + "T12:00:00");
    const day = start.getDay();
    const monday = new Date(start);
    monday.setDate(start.getDate() - (day === 0 ? 6 : day - 1));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [selectedDate]);

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary">
      {/* Week Navigation */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => {
            const d = new Date(selectedDate + "T12:00:00");
            d.setDate(d.getDate() - 7);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="rounded-lg p-1.5 text-muted hover:bg-surface"
        >
          <span className="material-icons text-[20px]">chevron_left</span>
        </button>

        <div className="flex gap-1">
          {weekDates.map((date) => {
            const d = new Date(date + "T12:00:00");
            const isSelected = date === selectedDate;
            const hasTours = !!toursByDate[date];
            const isToday = date === new Date().toISOString().split("T")[0];

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center rounded-lg px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-surface"
                }`}
              >
                <span className="font-medium">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`text-lg font-bold ${isSelected ? "" : "text-foreground"}`}>
                  {d.getDate()}
                </span>
                {hasTours && !isSelected && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            const d = new Date(selectedDate + "T12:00:00");
            d.setDate(d.getDate() + 7);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="rounded-lg p-1.5 text-muted hover:bg-surface"
        >
          <span className="material-icons text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* Day View */}
      <div className="p-4">
        <h3 className="mb-3 text-sm font-medium text-muted">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {dayTours.length > 0 && (
            <span className="ml-2 text-foreground">
              {dayTours.length} tour{dayTours.length !== 1 ? "s" : ""}
            </span>
          )}
        </h3>

        {dayTours.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            <span className="material-icons text-[32px] mb-2 block text-muted/30">
              event_available
            </span>
            No tours scheduled for this day.
          </div>
        ) : (
          <div className="space-y-2">
            {dayTours.map((tour, i) => (
              <div key={tour.id}>
                {/* Travel time indicator */}
                {tour.travelTimeFromPrev && i > 0 && (
                  <div className="flex items-center gap-2 py-1.5 px-3 text-xs text-muted">
                    <span className="material-icons text-[14px]">directions_car</span>
                    <span className="border-l border-dashed border-border h-4" />
                    <span>{tour.travelTimeFromPrev} min travel</span>
                  </div>
                )}

                {/* Tour card */}
                <div
                  className={`flex items-center gap-4 rounded-lg border-l-4 p-4 ${
                    statusColors[tour.status] || statusColors.SCHEDULED
                  }`}
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{formatTime(tour.scheduledTime)}</p>
                    <p className="text-xs text-muted">{tour.duration}min</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tour.prospectName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="material-icons text-[14px]">apartment</span>
                      {tour.propertyName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="material-icons text-[18px] text-muted">
                      {tourTypeIcons[tour.tourType] || "person"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tour.status === "CONFIRMED"
                          ? "bg-success/10 text-success"
                          : tour.status === "SCHEDULED"
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {tour.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
