"use client";

import { useState } from "react";

interface ApplicationFormProps {
  propertyId: string;
  propertyName: string;
  unitId?: string;
  applicationFee: number;
}

type Step = "personal" | "employment" | "references" | "review" | "submitted";

export function ApplicationForm({ propertyId, propertyName, unitId, applicationFee }: ApplicationFormProps) {
  const [step, setStep] = useState<Step>("personal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");

  // Employment
  const [employer, setEmployer] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employmentLength, setEmploymentLength] = useState("");

  // References
  const [ref1Name, setRef1Name] = useState("");
  const [ref1Phone, setRef1Phone] = useState("");
  const [ref1Rel, setRef1Rel] = useState("");
  const [ref2Name, setRef2Name] = useState("");
  const [ref2Phone, setRef2Phone] = useState("");
  const [ref2Rel, setRef2Rel] = useState("");

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    const references = [
      ...(ref1Name ? [{ name: ref1Name, phone: ref1Phone, relationship: ref1Rel }] : []),
      ...(ref2Name ? [{ name: ref2Name, phone: ref2Phone, relationship: ref2Rel }] : []),
    ];

    const res = await fetch("/api/public/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        unitId: unitId || undefined,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth || undefined,
        currentAddress: currentAddress || undefined,
        employer: employer || undefined,
        jobTitle: jobTitle || undefined,
        monthlyIncome: monthlyIncome || undefined,
        employmentLength: employmentLength || undefined,
        references: references.length > 0 ? references : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit application");
      setSubmitting(false);
      return;
    }

    setStep("submitted");
    setSubmitting(false);
  }

  const steps: { key: Step; label: string; icon: string }[] = [
    { key: "personal", label: "Personal", icon: "person" },
    { key: "employment", label: "Employment", icon: "work" },
    { key: "references", label: "References", icon: "people" },
    { key: "review", label: "Review", icon: "checklist" },
  ];

  return (
    <div>
      {/* Progress Steps */}
      {step !== "submitted" && (
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, i) => {
            const stepIndex = steps.findIndex((st) => st.key === step);
            const isActive = s.key === step;
            const isComplete = i < stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isActive ? "bg-primary text-white" :
                  isComplete ? "bg-success text-white" : "bg-surface text-muted"
                }`}>
                  {isComplete ? (
                    <span className="material-icons text-[16px]">check</span>
                  ) : (
                    <span className="material-icons text-[16px]">{s.icon}</span>
                  )}
                </div>
                <span className={`text-xs hidden sm:block ${isActive ? "text-primary font-medium" : "text-muted"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${isComplete ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>
          {error}
        </div>
      )}

      {/* Step: Personal */}
      {step === "personal" && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-6 space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="First Name *" value={firstName} onChange={setFirstName} />
            <InputField label="Last Name *" value={lastName} onChange={setLastName} />
            <InputField label="Email *" value={email} onChange={setEmail} type="email" />
            <InputField label="Phone *" value={phone} onChange={setPhone} type="tel" />
            <InputField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
            <InputField label="Current Address" value={currentAddress} onChange={setCurrentAddress} className="sm:col-span-2" />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep("employment")}
              disabled={!firstName || !lastName || !email || !phone}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Next
              <span className="material-icons text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Employment */}
      {step === "employment" && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-6 space-y-4">
          <h2 className="text-lg font-semibold">Employment & Income</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Employer" value={employer} onChange={setEmployer} />
            <InputField label="Job Title" value={jobTitle} onChange={setJobTitle} />
            <InputField label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} type="number" placeholder="$0.00" />
            <InputField label="How Long Employed" value={employmentLength} onChange={setEmploymentLength} placeholder="e.g. 2 years" />
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("personal")} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
              <span className="material-icons text-[18px]">arrow_back</span> Back
            </button>
            <button
              onClick={() => setStep("references")}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Next <span className="material-icons text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: References */}
      {step === "references" && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-6 space-y-4">
          <h2 className="text-lg font-semibold">References</h2>
          <p className="text-sm text-muted">Please provide at least one reference.</p>
          <div className="space-y-4">
            <div className="rounded-lg bg-surface p-4 space-y-3">
              <p className="text-sm font-medium">Reference 1</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label="Name" value={ref1Name} onChange={setRef1Name} />
                <InputField label="Phone" value={ref1Phone} onChange={setRef1Phone} type="tel" />
                <InputField label="Relationship" value={ref1Rel} onChange={setRef1Rel} placeholder="e.g. Landlord" />
              </div>
            </div>
            <div className="rounded-lg bg-surface p-4 space-y-3">
              <p className="text-sm font-medium">Reference 2 (optional)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label="Name" value={ref2Name} onChange={setRef2Name} />
                <InputField label="Phone" value={ref2Phone} onChange={setRef2Phone} type="tel" />
                <InputField label="Relationship" value={ref2Rel} onChange={setRef2Rel} />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("employment")} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
              <span className="material-icons text-[18px]">arrow_back</span> Back
            </button>
            <button
              onClick={() => setStep("review")}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Review <span className="material-icons text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white dark:bg-secondary p-6 space-y-4">
            <h2 className="text-lg font-semibold">Review Your Application</h2>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <ReviewField label="Name" value={`${firstName} ${lastName}`} />
              <ReviewField label="Email" value={email} />
              <ReviewField label="Phone" value={phone} />
              <ReviewField label="Date of Birth" value={dateOfBirth || "Not provided"} />
              <ReviewField label="Current Address" value={currentAddress || "Not provided"} />
              <ReviewField label="Employer" value={employer || "Not provided"} />
              <ReviewField label="Monthly Income" value={monthlyIncome ? `$${parseInt(monthlyIncome).toLocaleString()}` : "Not provided"} />
              <ReviewField label="References" value={ref1Name ? `${ref1Name}${ref2Name ? `, ${ref2Name}` : ""}` : "None"} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white dark:bg-secondary p-6">
            <div className="flex items-center justify-between text-sm mb-4">
              <span>Application Fee</span>
              <span className="font-semibold">${applicationFee}</span>
            </div>
            <p className="text-xs text-muted mb-4">
              By submitting, you authorize a credit and background check. The application fee is non-refundable.
            </p>

            <div className="flex justify-between">
              <button onClick={() => setStep("references")} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
                <span className="material-icons text-[18px]">arrow_back</span> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting ? (
                  <span className="material-icons animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-icons text-[18px]">send</span>
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Submitted */}
      {step === "submitted" && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
            <span className="material-icons text-success text-[32px]">check_circle</span>
          </div>
          <h2 className="text-xl font-bold text-secondary dark:text-white">Application Submitted!</h2>
          <p className="text-muted mt-2 max-w-md mx-auto">
            Your application for {propertyName} has been received. We'll review it and get back to you within 2-3 business days.
          </p>
          <p className="text-sm text-muted mt-4">
            A confirmation email has been sent to <strong>{email}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

function InputField({
  label, value, onChange, type = "text", placeholder, className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
