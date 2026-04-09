import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ApplicationActions } from "@/components/admin/ApplicationActions";

const screeningLabels: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-muted" },
  IN_PROGRESS: { label: "In Progress", color: "text-warning" },
  COMPLETED: { label: "Completed", color: "text-success" },
  FAILED: { label: "Failed", color: "text-danger" },
};

const docTypeLabels: Record<string, string> = {
  PAY_STUB: "Pay Stub",
  BANK_STATEMENT: "Bank Statement",
  TAX_RETURN: "Tax Return",
  ID_FRONT: "ID (Front)",
  ID_BACK: "ID (Back)",
  EMPLOYMENT_LETTER: "Employment Letter",
  RENTAL_HISTORY: "Rental History",
  PET_RECORDS: "Pet Records",
  OTHER: "Other",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, property: { companyId: session.user.companyId } },
    include: {
      property: { select: { id: true, name: true, address: true, city: true, state: true } },
      unit: { select: { id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, marketRent: true } },
      prospect: { select: { id: true, firstName: true, lastName: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!application) notFound();

  const screening = screeningLabels[application.screeningStatus] || screeningLabels.NOT_STARTED;
  const screeningResult = application.screeningResult as Record<string, unknown> | null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/applications"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <span className="material-icons text-[18px]">arrow_back</span>
          Applications
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary dark:text-white">
              Application: {application.firstName} {application.lastName}
            </h1>
            <p className="text-sm text-muted">
              {application.property.name}
              {application.unit && ` - Unit ${application.unit.unitNumber}`}
            </p>
          </div>
          <ApplicationActions
            applicationId={application.id}
            currentStatus={application.status}
            screeningStatus={application.screeningStatus}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-4 font-semibold text-secondary dark:text-white">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <Field label="Full Name" value={`${application.firstName} ${application.lastName}`} />
              <Field label="Email" value={application.email} />
              <Field label="Phone" value={application.phone} />
              <Field label="Date of Birth" value={application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : "-"} />
              <Field label="Current Address" value={application.currentAddress || "-"} className="sm:col-span-2" />
            </div>
          </section>

          {/* Employment */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-4 font-semibold text-secondary dark:text-white">Employment</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <Field label="Employer" value={application.employer || "-"} />
              <Field label="Job Title" value={application.jobTitle || "-"} />
              <Field label="Monthly Income" value={application.monthlyIncome ? `$${application.monthlyIncome.toLocaleString()}` : "-"} />
              <Field label="Length of Employment" value={application.employmentLength || "-"} />
            </div>
            {application.monthlyIncome && application.unit?.marketRent && (
              <div className="mt-4 rounded-lg bg-surface p-3 text-sm">
                <span className="text-muted">Income to Rent Ratio: </span>
                <span className={`font-semibold ${
                  application.monthlyIncome / application.unit.marketRent >= 3
                    ? "text-success" : "text-danger"
                }`}>
                  {(application.monthlyIncome / application.unit.marketRent).toFixed(1)}x
                </span>
                <span className="text-muted ml-1">(requirement: 3x)</span>
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-4 font-semibold text-secondary dark:text-white">
              Documents ({application.documents.length})
            </h2>
            {application.documents.length === 0 ? (
              <p className="text-sm text-muted">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-surface p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-[20px] text-primary">description</span>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted">
                          {docTypeLabels[doc.type] || doc.type}
                          {" - "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <span className="material-icons text-[16px]">open_in_new</span>
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* References */}
          {application.references && (
            <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
              <h2 className="mb-4 font-semibold text-secondary dark:text-white">References</h2>
              <div className="space-y-3">
                {(application.references as Array<{ name: string; phone: string; relationship: string }>).map((ref, i) => (
                  <div key={i} className="rounded-lg bg-surface p-3 text-sm">
                    <p className="font-medium">{ref.name}</p>
                    <p className="text-muted">{ref.relationship} - {ref.phone}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Unit Applied For */}
          {application.unit && (
            <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
              <h2 className="mb-3 font-semibold text-secondary dark:text-white">Unit</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Unit</span>
                  <span className="font-medium">#{application.unit.unitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Layout</span>
                  <span>{application.unit.bedrooms === 0 ? "Studio" : `${application.unit.bedrooms}bd`} / {application.unit.bathrooms}ba</span>
                </div>
                {application.unit.sqft && (
                  <div className="flex justify-between">
                    <span className="text-muted">Size</span>
                    <span>{application.unit.sqft.toLocaleString()} sqft</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Rent</span>
                  <span className="font-semibold text-primary">${application.unit.marketRent?.toLocaleString()}/mo</span>
                </div>
              </div>
            </section>
          )}

          {/* Screening Status */}
          <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
            <h2 className="mb-3 font-semibold text-secondary dark:text-white">Screening</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-icons text-[18px] ${screening.color}`}>
                {application.screeningStatus === "COMPLETED" ? "verified" :
                 application.screeningStatus === "FAILED" ? "error" :
                 application.screeningStatus === "IN_PROGRESS" ? "pending" : "radio_button_unchecked"}
              </span>
              <span className={`text-sm font-medium ${screening.color}`}>{screening.label}</span>
            </div>

            {screeningResult && (
              <div className="space-y-2 text-sm">
                {screeningResult.creditScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted">Credit Score</span>
                    <span className={`font-medium ${
                      (screeningResult.creditScore as number) >= 700 ? "text-success" :
                      (screeningResult.creditScore as number) >= 600 ? "text-warning" : "text-danger"
                    }`}>
                      {String(screeningResult.creditScore)}
                    </span>
                  </div>
                )}
                {screeningResult.backgroundCheck !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted">Background</span>
                    <span className={screeningResult.backgroundCheck === "clear" ? "text-success" : "text-danger"}>
                      {String(screeningResult.backgroundCheck)}
                    </span>
                  </div>
                )}
                {screeningResult.evictionHistory !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted">Eviction History</span>
                    <span className={screeningResult.evictionHistory === "none" ? "text-success" : "text-danger"}>
                      {String(screeningResult.evictionHistory)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Decision */}
          {application.decisionNote && (
            <section className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
              <h2 className="mb-3 font-semibold text-secondary dark:text-white">Decision Note</h2>
              <p className="text-sm text-muted">{application.decisionNote}</p>
              {application.decidedAt && (
                <p className="text-xs text-muted mt-2">
                  Decided {new Date(application.decidedAt).toLocaleDateString()}
                </p>
              )}
            </section>
          )}

          {/* Prospect Link */}
          {application.prospect && (
            <Link
              href={`/admin/prospects/${application.prospect.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white dark:bg-secondary p-4 hover:border-primary/30 transition-colors"
            >
              <span className="material-icons text-primary">person</span>
              <div>
                <p className="text-sm font-medium">View Prospect Profile</p>
                <p className="text-xs text-muted">
                  {application.prospect.firstName} {application.prospect.lastName}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-muted text-xs mb-0.5">{label}</p>
      <p>{value}</p>
    </div>
  );
}
