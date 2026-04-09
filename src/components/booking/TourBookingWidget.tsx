"use client";

import { useState, useEffect } from "react";

interface TourBookingWidgetProps {
  propertyId: string;
  propertyName: string;
}

interface Slot {
  time: string;
  endTime: string;
  agentCount: number;
}

interface BookingResult {
  id: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhone: string | null;
  agentName: string | null;
  scheduledDate: string;
  scheduledTime: string;
  tourType: string;
}

type Step = "date" | "time" | "info" | "confirmed";

export function TourBookingWidget({ propertyId, propertyName }: TourBookingWidgetProps) {
  const [step, setStep] = useState<Step>("date");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Contact form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tourType, setTourType] = useState("IN_PERSON");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);

  // Load slots when date changes
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedTime("");
    setSlots([]);

    fetch(`/api/public/availability?propertyId=${propertyId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, propertyId]);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/public/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        scheduledDate: date,
        scheduledTime: selectedTime,
        prospectName: name,
        prospectEmail: email,
        prospectPhone: phone || undefined,
        tourType,
        notes: notes || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to book tour");
      setSubmitting(false);
      return;
    }

    setBooking(data.tour);
    setStep("confirmed");
    setSubmitting(false);
  }

  // Generate calendar link
  function getCalendarLink(): string {
    if (!booking) return "#";
    const startDate = new Date(`${booking.scheduledDate.split("T")[0]}T${booking.scheduledTime}:00`);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Tour: ${booking.propertyName}`)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(`Tour with ${booking.agentName || "your agent"} at ${booking.propertyAddress}`)}&location=${encodeURIComponent(booking.propertyAddress)}`;
  }

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary overflow-hidden">
      <div className="bg-primary px-5 py-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="material-icons text-[20px]">calendar_month</span>
          Schedule a Tour
        </h3>
        <p className="text-sm text-white/70 mt-0.5">{propertyName}</p>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>
            {error}
          </div>
        )}

        {/* Step: Date */}
        {step === "date" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Select a Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {date && (
              <button
                onClick={() => setStep("time")}
                disabled={!date}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                View Available Times
              </button>
            )}
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("date")}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <span className="material-icons text-[16px]">arrow_back</span>
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </button>

            {loadingSlots ? (
              <div className="py-6 text-center text-sm text-muted">
                <span className="material-icons animate-spin text-[24px] block mb-2">progress_activity</span>
                Loading available times...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted">
                <span className="material-icons text-[24px] block mb-2 text-muted/30">event_busy</span>
                No available times for this date.
                <button
                  onClick={() => setStep("date")}
                  className="mt-2 block text-primary hover:underline mx-auto"
                >
                  Try another date
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                        selectedTime === slot.time
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {formatTime(slot.time)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("info")}
                  disabled={!selectedTime}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        )}

        {/* Step: Contact Info */}
        {step === "info" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("time")}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <span className="material-icons text-[16px]">arrow_back</span>
              {formatTime(selectedTime)} on{" "}
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </button>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="(215) 555-0000"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Tour Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "IN_PERSON", icon: "person", label: "In Person" },
                  { value: "VIDEO", icon: "videocam", label: "Video" },
                  { value: "SELF_GUIDED", icon: "key", label: "Self-Guided" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTourType(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-xs font-medium transition-colors ${
                      tourType === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted hover:border-primary/30"
                    }`}
                  >
                    <span className="material-icons text-[18px]">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Unit preferences, questions, etc."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !name || !email}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <span className="material-icons animate-spin text-[18px]">progress_activity</span>
              ) : (
                <>
                  <span className="material-icons text-[18px]">check_circle</span>
                  Confirm Tour
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Confirmed */}
        {step === "confirmed" && booking && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <span className="material-icons text-success text-[32px]">check_circle</span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-secondary dark:text-white">Tour Scheduled!</h3>
              <p className="text-sm text-muted mt-1">
                We've confirmed your tour at {booking.propertyName}.
              </p>
            </div>

            <div className="rounded-lg bg-surface p-4 text-left space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[16px] text-muted">calendar_today</span>
                {new Date(booking.scheduledDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-[16px] text-muted">schedule</span>
                {formatTime(booking.scheduledTime)}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-[16px] text-muted">location_on</span>
                {booking.propertyAddress}
              </div>
              {booking.agentName && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[16px] text-muted">person</span>
                  Your agent: {booking.agentName}
                </div>
              )}
            </div>

            <a
              href={getCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
            >
              <span className="material-icons text-[18px]">event</span>
              Add to Calendar
            </a>

            {booking.propertyPhone && (
              <p className="text-xs text-muted">
                Questions? Call us at{" "}
                <a href={`tel:${booking.propertyPhone}`} className="text-primary hover:underline">
                  {booking.propertyPhone}
                </a>
              </p>
            )}
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
