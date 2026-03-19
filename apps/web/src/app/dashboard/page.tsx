"use client";

import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";

const explanationStatusLabel = {
  none: "No explanation",
  requested: "Explanation requested",
  generated: "Explanation ready",
  failed: "Explanation failed",
} as const;

const failureReasonLabel = {
  allergy_conflict: "Allergy conflict",
  identity_mismatch: "Identity mismatch",
  medication_not_found: "Medication not found",
  wristband_not_found: "Wristband not found",
} as const;

const resultFilterOptions = [
  { value: "all", label: "All results" },
  { value: "pass", label: "Pass only" },
  { value: "fail", label: "Fail only" },
] as const;

type ResultFilter = (typeof resultFilterOptions)[number]["value"];

type AdminReviewRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.scanLogs.listForAdminReview>>
>[number];

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>;
}

function AuthLoadingState() {
  return (
    <DashboardShell>
      <Card className="max-w-2xl border-dashed">
        <CardHeader>
          <CardTitle>Loading MediTag admin review</CardTitle>
          <CardDescription>Checking your session and available review data.</CardDescription>
        </CardHeader>
      </Card>
    </DashboardShell>
  );
}

function UnauthenticatedDashboard() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <DashboardShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(24rem,28rem)] lg:items-start">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-2xl">Meditag Admin Review</CardTitle>
            <CardDescription>
              Review recent medication scan outcomes, confirm failures, and keep demo audit activity
              visible for admins.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="border-l-2 border-emerald-600 pl-3">
              <p className="font-medium">Pass and fail status</p>
              <p className="text-muted-foreground">See deterministic outcomes at a glance.</p>
            </div>
            <div className="border-l-2 border-amber-500 pl-3">
              <p className="font-medium">Patient and medication context</p>
              <p className="text-muted-foreground">Keep each scan tied to the right record.</p>
            </div>
            <div className="border-l-2 border-sky-600 pl-3">
              <p className="font-medium">Explanation tracking</p>
              <p className="text-muted-foreground">
                Know whether a failed scan has follow-up context.
              </p>
            </div>
          </CardContent>
        </Card>

        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </DashboardShell>
  );
}

function AccessDeniedState({ role }: { role: "nurse" | null }) {
  return (
    <DashboardShell>
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Admin access required</CardTitle>
              <CardDescription>
                MediTag web review is limited to demo admins for V1. Signed-in nurses should use the
                native scan workflow instead.
              </CardDescription>
            </div>
            <UserMenu />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="bg-muted flex items-center justify-between gap-3 border px-4 py-3">
            <span className="text-muted-foreground">Current role</span>
            <span className="font-medium capitalize">{role ?? "Unknown"}</span>
          </div>
          <div className="text-muted-foreground border px-4 py-3">
            Ask an admin account to sign in here if you need to review recent scan logs.
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function RoleLoadingState() {
  return (
    <DashboardShell>
      <Card className="max-w-2xl border-dashed">
        <CardHeader>
          <CardTitle>Checking access</CardTitle>
          <CardDescription>Loading your MediTag role for admin review.</CardDescription>
        </CardHeader>
      </Card>
    </DashboardShell>
  );
}

function AdminReviewContent() {
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedScanLogId, setSelectedScanLogId] = useState<Id<"scanLogs"> | null>(null);

  const queryArgs = {
    limit: 100,
    result: resultFilter === "all" ? undefined : resultFilter,
    createdAtStart: startDate ? toDayStartTimestamp(startDate) : undefined,
    createdAtEnd: endDate ? toDayEndTimestamp(endDate) : undefined,
  };

  const scanLogs = useQuery(api.scanLogs.listForAdminReview, queryArgs);

  const filteredScanLogs = useMemo(() => {
    if (!scanLogs) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return scanLogs;
    }

    return scanLogs.filter((scanLog) => matchesSearch(scanLog, normalizedSearch));
  }, [scanLogs, searchTerm]);

  useEffect(() => {
    if (filteredScanLogs.length === 0) {
      if (selectedScanLogId !== null) {
        setSelectedScanLogId(null);
      }
      return;
    }

    const selectedStillVisible = filteredScanLogs.some(
      (scanLog) => scanLog.scanLogId === selectedScanLogId,
    );

    if (!selectedStillVisible) {
      setSelectedScanLogId(filteredScanLogs[0]!.scanLogId);
    }
  }, [filteredScanLogs, selectedScanLogId]);

  const selectedScanLog = filteredScanLogs.find(
    (scanLog) => scanLog.scanLogId === selectedScanLogId,
  );
  const selectedScanLogDetail = useQuery(
    api.scanLogs.getAdminScanLogDetail,
    selectedScanLogId ? { scanLogId: selectedScanLogId } : "skip",
  );

  const totalCount = filteredScanLogs.length;
  const passCount = filteredScanLogs.filter((scanLog) => scanLog.result === "pass").length;
  const failCount = filteredScanLogs.filter((scanLog) => scanLog.result === "fail").length;

  return (
    <DashboardShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Recent scan events</CardTitle>
                <CardDescription>
                  Admin-facing review of the latest MediTag verification activity.
                </CardDescription>
              </div>
              <UserMenu />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Events shown" value={String(totalCount)} tone="neutral" />
            <MetricCard label="Pass" value={String(passCount)} tone="pass" />
            <MetricCard label="Fail" value={String(failCount)} tone="fail" />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)] xl:items-start">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review filters</CardTitle>
                <CardDescription>
                  Narrow repeated demo activity by result, date window, or basic search.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] md:items-end">
                <FilterField label="Search">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Patient, medication, token, scanner"
                  />
                </FilterField>
                <FilterField label="Result">
                  <select
                    value={resultFilter}
                    onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
                    className="border-input bg-background h-8 w-full rounded-none border px-2.5 text-xs outline-none"
                  >
                    {resultFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="From">
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </FilterField>
                <FilterField label="To">
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </FilterField>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setResultFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Reset filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scan log list</CardTitle>
                <CardDescription>
                  Stable review list with quick drill-in for deterministic outcomes and explanation
                  state.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-4">
                {scanLogs === undefined ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">
                    Loading recent scan events…
                  </div>
                ) : scanLogs.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">
                    No scan events yet. Complete a medication scan in the native app to populate
                    this review list.
                  </div>
                ) : filteredScanLogs.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">
                    No scan events match the current filters. Broaden the date range or search term.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredScanLogs.map((scanLog) => {
                      const failureSummary = getFailureSummary(scanLog.failureReasons);
                      const isSelected = scanLog.scanLogId === selectedScanLogId;

                      return (
                        <article
                          key={scanLog.scanLogId}
                          className={cn(
                            "border-border/80 bg-background grid gap-4 border px-4 py-4",
                            isSelected && "border-sky-600 bg-sky-500/5",
                          )}
                        >
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge result={scanLog.result} />
                              <InfoBadge
                                label={explanationStatusLabel[scanLog.explanationStatus]}
                              />
                              <InfoBadge label={scanLog.metadata.scanType.toUpperCase()} />
                            </div>
                            <div className="flex items-center gap-2 self-start">
                              <p className="text-muted-foreground text-sm">
                                Verified {dateTimeFormatter.format(scanLog.createdAt)}
                              </p>
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => setSelectedScanLogId(scanLog.scanLogId)}
                              >
                                {isSelected ? "Viewing detail" : "View detail"}
                              </Button>
                            </div>
                          </div>

                          <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                            <ReviewField
                              label="Patient"
                              value={scanLog.patient?.displayName ?? "Patient record missing"}
                              detail={scanLog.patient?.mrn ?? `Token ${scanLog.scannedToken}`}
                            />
                            <ReviewField
                              label="Medication"
                              value={scanLog.medication?.displayName ?? "Medication record missing"}
                              detail={
                                scanLog.medication?.dose ??
                                scanLog.medication?.route ??
                                "No dose captured"
                              }
                            />
                            <ReviewField
                              label="Scanner"
                              value={
                                scanLog.scanner.displayName ??
                                scanLog.scanner.email ??
                                "Unknown user"
                              }
                              detail={scanLog.scanner.email ?? scanLog.scanner.authUserId}
                            />
                            <ReviewField
                              label="Explanation"
                              value={explanationStatusLabel[scanLog.explanationStatus]}
                              detail={scanLog.explanationModel ?? "No model recorded"}
                            />
                            <ReviewField
                              label="Outcome detail"
                              value={
                                scanLog.result === "pass" ? "Medication cleared" : failureSummary
                              }
                              detail={scanLog.wristband?.token ?? scanLog.scannedToken}
                            />
                          </dl>

                          {scanLog.explanationText ? (
                            <div className="bg-muted/60 border-l-2 border-sky-600 px-3 py-2 text-sm">
                              <p className="font-medium">Explanation preview</p>
                              <p className="text-muted-foreground mt-1 line-clamp-3">
                                {scanLog.explanationText}
                              </p>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Log detail</CardTitle>
              <CardDescription>
                Drill into one scan to review deterministic rationale, explanation status, and event
                metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedScanLogId === null ? (
                <p className="text-sm text-muted-foreground">
                  Select a scan log to inspect the full review detail.
                </p>
              ) : selectedScanLogDetail === undefined ? (
                <p className="text-sm text-muted-foreground">Loading scan log detail…</p>
              ) : selectedScanLogDetail === null ? (
                <p className="text-sm text-muted-foreground">
                  This scan log is no longer available.
                </p>
              ) : (
                <ScanLogDetailPanel
                  scanLogId={selectedScanLogId}
                  selectedScanLog={selectedScanLog ?? null}
                  detail={selectedScanLogDetail}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function AuthenticatedDashboard() {
  const role = useQuery(api.users.getCurrentUserRole);

  if (role === undefined) {
    return <RoleLoadingState />;
  }

  if (role !== "admin") {
    return <AccessDeniedState role={role} />;
  }

  return <AdminReviewContent />;
}

function ScanLogDetailPanel({
  scanLogId,
  selectedScanLog,
  detail,
}: {
  scanLogId: Id<"scanLogs">;
  selectedScanLog: AdminReviewRow | null;
  detail: NonNullable<ReturnType<typeof useQuery<typeof api.scanLogs.getAdminScanLogDetail>>>;
}) {
  const failureSummary = getFailureSummary(detail.scanLog.failureReasons);
  const explanationText = detail.scanLog.explanationText;

  return (
    <div className="grid gap-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge result={detail.scanLog.result} />
        <InfoBadge label={explanationStatusLabel[detail.scanLog.explanationStatus]} />
        <InfoBadge label={detail.scanLog.metadata.scanType.toUpperCase()} />
      </div>

      <section className="grid gap-3 border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Deterministic review</h3>
        <ReviewField
          label="Result"
          value={detail.scanLog.result === "pass" ? "Pass" : "Fail"}
          detail={detail.scanLog.result === "pass" ? "Medication cleared" : failureSummary}
        />
        <div className="grid gap-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Failure reasons
          </p>
          {detail.scanLog.failureReasons.length > 0 ? (
            <ul className="grid gap-2">
              {detail.scanLog.failureReasons.map((reason) => (
                <li key={reason} className="bg-muted border px-3 py-2">
                  {failureReasonLabel[reason]}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground border px-3 py-2">No deterministic failures.</div>
          )}
        </div>
      </section>

      <section className="grid gap-3 border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Explanation</h3>
        <ReviewField
          label="Status"
          value={explanationStatusLabel[detail.scanLog.explanationStatus]}
          detail={detail.scanLog.explanationModel ?? "No model recorded"}
        />
        <div className="grid gap-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Explanation text
          </p>
          <div className="bg-muted/60 border px-3 py-3 text-sm">
            {explanationText ?? getExplanationEmptyState(detail.scanLog.explanationStatus)}
          </div>
        </div>
      </section>

      <section className="grid gap-3 border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Linked records</h3>
        <ReviewField
          label="Patient"
          value={detail.patient?.displayName ?? "Patient record missing"}
          detail={
            detail.patient
              ? `${detail.patient.mrn} • DOB ${detail.patient.dob}`
              : detail.scanLog.scannedToken
          }
        />
        <ReviewField
          label="Medication"
          value={detail.medication?.displayName ?? "Medication record missing"}
          detail={
            detail.medication
              ? [detail.medication.dose, detail.medication.route, detail.medication.frequency]
                  .filter(Boolean)
                  .join(" • ") || detail.medication.rxNormCode
              : "No linked medication record"
          }
        />
        <ReviewField
          label="Scanner"
          value={detail.scanner.displayName ?? detail.scanner.email ?? "Unknown user"}
          detail={detail.scanner.email ?? detail.scanner.authUserId}
        />
        <ReviewField
          label="Wristband"
          value={detail.wristband?.token ?? detail.scanLog.scannedToken}
          detail={
            detail.wristband
              ? `${detail.wristband.tokenType.toUpperCase()} • ${detail.wristband.isActive ? "Active" : "Inactive"}`
              : "No linked wristband record"
          }
        />
      </section>

      <section className="grid gap-3 border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Event metadata</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ReviewField label="Log ID" value={scanLogId} detail="Stable review reference" />
          <ReviewField
            label="Verified at"
            value={dateTimeFormatter.format(detail.scanLog.createdAt)}
            detail={dateFormatter.format(detail.scanLog.createdAt)}
          />
          <ReviewField
            label="Decision version"
            value={detail.scanLog.deterministicDecisionVersion}
            detail="Deterministic ruleset authority"
          />
          <ReviewField
            label="Device"
            value={detail.scanLog.metadata.deviceId ?? "No device recorded"}
            detail={detail.scanLog.metadata.scanType.toUpperCase()}
          />
          <ReviewField
            label="Scanned token"
            value={detail.scanLog.scannedToken}
            detail={selectedScanLog?.patient?.mrn ?? "Stored with every scan event"}
          />
          <ReviewField
            label="Patient allergies"
            value={detail.patient?.allergyLabels.join(", ") || "No allergies recorded"}
            detail={detail.patient?.allergyCodes.join(", ") || "No allergy codes recorded"}
          />
        </div>
      </section>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "pass" | "fail";
}) {
  return (
    <div
      className={cn(
        "grid gap-1 border px-4 py-3",
        tone === "pass" && "border-emerald-700/40 bg-emerald-500/5",
        tone === "fail" && "border-red-700/40 bg-red-500/5",
      )}
    >
      <span className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ result }: { result: "pass" | "fail" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 text-xs font-medium uppercase tracking-[0.18em]",
        result === "pass"
          ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-700/40 bg-red-500/10 text-red-700 dark:text-red-300",
      )}
    >
      {result}
    </span>
  );
}

function InfoBadge({ label }: { label: string }) {
  return <span className="bg-muted text-muted-foreground border px-2 py-1 text-xs">{label}</span>;
}

function ReviewField({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
      <dd className="text-muted-foreground break-words">{detail}</dd>
    </div>
  );
}

function getFailureSummary(failureReasons: Array<keyof typeof failureReasonLabel>) {
  return failureReasons.length > 0
    ? failureReasons.map((reason) => failureReasonLabel[reason]).join(", ")
    : "No failure reasons";
}

function getExplanationEmptyState(status: keyof typeof explanationStatusLabel) {
  if (status === "requested") {
    return "Explanation generation was requested and is still pending.";
  }

  if (status === "failed") {
    return "Explanation generation failed. Use the deterministic failure reasons above as the source of truth.";
  }

  return "No explanation text stored for this scan event.";
}

function toDayStartTimestamp(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

function toDayEndTimestamp(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

function matchesSearch(scanLog: AdminReviewRow, normalizedSearch: string) {
  const searchHaystack = [
    scanLog.patient?.displayName,
    scanLog.patient?.mrn,
    scanLog.medication?.displayName,
    scanLog.medication?.rxNormCode,
    scanLog.scanner.displayName,
    scanLog.scanner.email,
    scanLog.scannedToken,
    scanLog.wristband?.token,
    scanLog.explanationText,
    ...scanLog.failureReasons.map((reason) => failureReasonLabel[reason]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchHaystack.includes(normalizedSearch);
}

export default function DashboardPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedDashboard />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedDashboard />
      </Unauthenticated>
      <AuthLoading>
        <AuthLoadingState />
      </AuthLoading>
    </>
  );
}
