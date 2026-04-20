"use client";

import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

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

type AdminReviewList = NonNullable<
  ReturnType<typeof useQuery<typeof api.scanLogs.listForAdminReview>>
>;
type AdminReviewRow = AdminReviewList[number];
type AdminReviewDetail = NonNullable<
  Exclude<ReturnType<typeof useQuery<typeof api.scanLogs.getAdminScanLogDetail>>, undefined | null>
>;

const isPlaywrightReviewFixtureEnabled = process.env.NEXT_PUBLIC_E2E_ADMIN_FIXTURE === "1";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>;
}

function AuthLoadingState() {
  return (
    <DashboardShell>
      <Card className="max-w-md border-dashed">
        <CardHeader>
          <CardTitle>Loading…</CardTitle>
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
          <CardHeader className="gap-2">
            <CardTitle className="text-3xl tracking-tight">Meditag Admin Review</CardTitle>
            <CardDescription className="text-base">
              Review recent scan activity and flagged results.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md border-l-2 border-emerald-600 pl-3">
              <p className="font-medium">Outcomes</p>
              <p className="text-muted-foreground">Pass and fail at a glance.</p>
            </div>
            <div className="rounded-md border-l-2 border-amber-500 pl-3">
              <p className="font-medium">Context</p>
              <p className="text-muted-foreground">Patient and medication for every scan.</p>
            </div>
            <div className="rounded-md border-l-2 border-sky-600 pl-3">
              <p className="font-medium">Follow-up</p>
              <p className="text-muted-foreground">Track explanations on failed scans.</p>
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
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Admin access only</CardTitle>
              <CardDescription>
                This view is limited to administrators. Nurses should continue in the mobile app.
              </CardDescription>
            </div>
            <UserMenu />
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/60 flex items-center justify-between gap-3 rounded-md px-4 py-3 text-sm">
            <span className="text-muted-foreground">Signed in as</span>
            <span className="font-medium capitalize">{role ?? "Unknown role"}</span>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function RoleLoadingState() {
  return (
    <DashboardShell>
      <Card className="max-w-md border-dashed">
        <CardHeader>
          <CardTitle>Loading…</CardTitle>
        </CardHeader>
      </Card>
    </DashboardShell>
  );
}

function AdminReviewContent({ fixtureMode = false }: { fixtureMode?: boolean }) {
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

  const liveScanLogs = useQuery(api.scanLogs.listForAdminReview, fixtureMode ? "skip" : queryArgs);
  const scanLogs = useMemo(() => {
    if (fixtureMode) {
      return filterFixtureScanLogs(queryArgs);
    }
    return liveScanLogs;
  }, [
    fixtureMode,
    liveScanLogs,
    queryArgs.createdAtEnd,
    queryArgs.createdAtStart,
    queryArgs.result,
  ]);

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
  const liveSelectedScanLogDetail = useQuery(
    api.scanLogs.getAdminScanLogDetail,
    fixtureMode || !selectedScanLogId ? "skip" : { scanLogId: selectedScanLogId },
  );
  const selectedScanLogDetail = fixtureMode
    ? selectedScanLogId
      ? (fixtureScanLogDetails[selectedScanLogId] ?? null)
      : null
    : liveSelectedScanLogDetail;

  const totalCount = filteredScanLogs.length;
  const passCount = filteredScanLogs.filter((scanLog) => scanLog.result === "pass").length;
  const failCount = filteredScanLogs.filter((scanLog) => scanLog.result === "fail").length;

  return (
    <DashboardShell>
      <div className="grid gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Recent scan events</h1>
            <p className="text-sm text-muted-foreground">
              Live verifications from the bedside, with outcomes and follow-up.
            </p>
          </div>
          <UserMenu />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Events" value={String(totalCount)} tone="neutral" />
          <MetricCard label="Pass" value={String(passCount)} tone="pass" />
          <MetricCard label="Fail" value={String(failCount)} tone="fail" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)] xl:items-start">
          <div className="grid gap-4">
            <Card data-testid="scan-log-filters">
              <CardContent className="grid gap-3 pt-6 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] md:items-end">
                <FilterField label="Search">
                  <Input
                    data-testid="scan-log-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Patient, medication, scanner…"
                  />
                </FilterField>
                <FilterField label="Result">
                  <select
                    data-testid="scan-log-result-filter"
                    value={resultFilter}
                    onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
                    className="border-input bg-background h-9 w-full rounded-md border px-2.5 text-sm outline-none"
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
                    data-testid="scan-log-from-date"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </FilterField>
                <FilterField label="To">
                  <Input
                    data-testid="scan-log-to-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </FilterField>
                <Button
                  data-testid="scan-log-reset-filters"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setResultFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Reset
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-0 pt-6 sm:px-4">
                {scanLogs === undefined ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
                ) : scanLogs.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">
                    No scan events yet. Complete a verification in the mobile app to populate this
                    list.
                  </div>
                ) : filteredScanLogs.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground">
                    No events match the current filters.
                  </div>
                ) : (
                  <div data-testid="scan-log-list" className="grid gap-2">
                    {filteredScanLogs.map((scanLog) => {
                      const failureSummary = getFailureSummary(scanLog.failureReasons);
                      const isSelected = scanLog.scanLogId === selectedScanLogId;
                      const outcomeText = scanLog.result === "pass" ? "Cleared" : failureSummary;

                      return (
                        <article
                          key={scanLog.scanLogId}
                          data-testid={`scan-log-row-${scanLog.scanLogId}`}
                          className={cn(
                            "border-border/60 bg-background grid gap-3 rounded-md border px-4 py-3 transition-colors",
                            isSelected && "border-sky-600 bg-sky-500/5",
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge result={scanLog.result} />
                            <span className="text-sm font-medium">
                              {scanLog.patient?.displayName ?? "Unknown patient"}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {scanLog.medication?.displayName ?? "—"}
                            </span>
                            <span className="ml-auto text-muted-foreground text-xs">
                              {dateTimeFormatter.format(scanLog.createdAt)}
                            </span>
                            <Button
                              data-testid={`scan-log-view-detail-${scanLog.scanLogId}`}
                              size="sm"
                              variant={isSelected ? "default" : "ghost"}
                              onClick={() => setSelectedScanLogId(scanLog.scanLogId)}
                            >
                              {isSelected ? "Selected" : "View"}
                            </Button>
                          </div>

                          <div className="grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                            <span>
                              <span className="text-foreground/70">Outcome:</span> {outcomeText}
                            </span>
                            <span>
                              <span className="text-foreground/70">Scanner:</span>{" "}
                              {scanLog.scanner.displayName ?? scanLog.scanner.email ?? "—"}
                            </span>
                            <span>
                              <span className="text-foreground/70">Explanation:</span>{" "}
                              {explanationStatusLabel[scanLog.explanationStatus]}
                            </span>
                          </div>

                          {scanLog.explanationText ? (
                            <p className="text-muted-foreground border-l-2 border-sky-600/60 pl-3 text-sm line-clamp-2">
                              {scanLog.explanationText}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="scan-log-detail" className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Log detail</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScanLogId === null ? (
                <p className="text-sm text-muted-foreground">Select an event to see details.</p>
              ) : selectedScanLogDetail === undefined ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : selectedScanLogDetail === null ? (
                <p className="text-sm text-muted-foreground">This event is no longer available.</p>
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
  scanLogId: _scanLogId,
  selectedScanLog: _selectedScanLog,
  detail,
}: {
  scanLogId: Id<"scanLogs">;
  selectedScanLog: AdminReviewRow | null;
  detail: NonNullable<ReturnType<typeof useQuery<typeof api.scanLogs.getAdminScanLogDetail>>>;
}) {
  const failureSummary = getFailureSummary(detail.scanLog.failureReasons);
  const explanationText = detail.scanLog.explanationText;
  const verifiedAt = dateTimeFormatter.format(detail.scanLog.createdAt);

  return (
    <div className="grid gap-6 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge result={detail.scanLog.result} />
        <span className="text-muted-foreground text-xs">{verifiedAt}</span>
      </div>

      <DetailSection title="Result">
        <ReviewField
          label={detail.scanLog.result === "pass" ? "Pass" : "Fail"}
          value={detail.scanLog.result === "pass" ? "Medication cleared" : failureSummary}
        />
        {detail.scanLog.failureReasons.length > 0 ? (
          <ul className="grid gap-2">
            {detail.scanLog.failureReasons.map((reason) => (
              <li key={reason} className="bg-muted/60 rounded-md border px-3 py-2 text-sm">
                {failureReasonLabel[reason]}
              </li>
            ))}
          </ul>
        ) : null}
      </DetailSection>

      <DetailSection title="Explanation">
        <ReviewField
          label={explanationStatusLabel[detail.scanLog.explanationStatus]}
          value={explanationText ?? getExplanationEmptyState(detail.scanLog.explanationStatus)}
        />
      </DetailSection>

      <DetailSection title="Patient">
        <ReviewField
          label={detail.patient?.displayName ?? "Patient record missing"}
          value={detail.patient ? `MRN ${detail.patient.mrn} • DOB ${detail.patient.dob}` : "—"}
        />
        {detail.patient ? (
          <ReviewField
            label="Allergies"
            value={
              detail.patient.allergyLabels.length > 0
                ? detail.patient.allergyLabels.join(", ")
                : "None recorded"
            }
          />
        ) : null}
      </DetailSection>

      <DetailSection title="Medication">
        <ReviewField
          label={detail.medication?.displayName ?? "Medication record missing"}
          value={
            detail.medication
              ? [detail.medication.dose, detail.medication.route, detail.medication.frequency]
                  .filter(Boolean)
                  .join(" • ") || "—"
              : "—"
          }
        />
      </DetailSection>

      <DetailSection title="Scanner">
        <ReviewField
          label={detail.scanner.displayName ?? detail.scanner.email ?? "Unknown user"}
          value={detail.scanner.email ?? ""}
        />
      </DetailSection>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
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
        "grid gap-1 rounded-md border px-4 py-3",
        tone === "pass" && "border-emerald-700/40 bg-emerald-500/5",
        tone === "fail" && "border-red-700/40 bg-red-500/5",
      )}
    >
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ result }: { result: "pass" | "fail" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        result === "pass"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-red-500/10 text-red-700 dark:text-red-300",
      )}
    >
      {result === "pass" ? "Pass" : "Fail"}
    </span>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="font-medium break-words">{label}</dt>
      <dd className="text-muted-foreground break-words">{value}</dd>
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
    return "Explanation generation failed.";
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

function useAdminReviewFixtureMode() {
  const searchParams = useSearchParams();
  return isPlaywrightReviewFixtureEnabled && searchParams.get("fixture") === "admin-review";
}

function filterFixtureScanLogs(args: {
  result?: "pass" | "fail";
  createdAtStart?: number;
  createdAtEnd?: number;
}) {
  return fixtureScanLogs.filter((scanLog) => {
    if (args.result && scanLog.result !== args.result) {
      return false;
    }
    if (args.createdAtStart !== undefined && scanLog.createdAt < args.createdAtStart) {
      return false;
    }
    if (args.createdAtEnd !== undefined && scanLog.createdAt > args.createdAtEnd) {
      return false;
    }
    return true;
  });
}

const fixtureConflictScanLogId = "fixture-scan-log-conflict" as Id<"scanLogs">;
const fixtureSafeScanLogId = "fixture-scan-log-safe" as Id<"scanLogs">;
const fixtureConflictPatientId = "fixture-patient-conflict" as Id<"patients">;
const fixtureSafePatientId = "fixture-patient-safe" as Id<"patients">;
const fixtureConflictMedicationId = "fixture-medication-conflict" as Id<"medications">;
const fixtureSafeMedicationId = "fixture-medication-safe" as Id<"medications">;
const fixtureConflictWristbandId = "fixture-wristband-conflict" as Id<"wristbands">;
const fixtureSafeWristbandId = "fixture-wristband-safe" as Id<"wristbands">;

const fixtureScanLogs: AdminReviewList = [
  {
    scanLogId: fixtureConflictScanLogId,
    createdAt: Date.UTC(2026, 2, 19, 15, 30),
    result: "fail",
    failureReasons: ["allergy_conflict"],
    explanationStatus: "generated",
    explanationText:
      "The stored allergy list already flags penicillin, so the deterministic check blocked amoxicillin before administration.",
    explanationModel: "openai:gpt-4.1-mini",
    scannedToken: "WRISTBAND-CONFLICT-QR-001",
    metadata: {
      scanType: "qr",
      deviceId: "ios-sim-admin-review",
    },
    scanner: {
      authUserId: "fixture-nurse-conflict",
      displayName: "Nurse Maya Chen",
      email: "maya.chen@example.com",
    },
    patient: {
      _id: fixtureConflictPatientId,
      mrn: "MRN-CONFLICT-001",
      displayName: "Demo Conflict Patient",
      dob: "1985-06-15",
      allergyLabels: ["Penicillin allergy"],
    },
    medication: {
      _id: fixtureConflictMedicationId,
      displayName: "Amoxicillin 500mg",
      rxNormCode: "723",
      route: "PO",
      dose: "1 capsule",
      frequency: "BID",
    },
    wristband: {
      _id: fixtureConflictWristbandId,
      token: "WRISTBAND-CONFLICT-QR-001",
      tokenType: "qr",
      isActive: true,
    },
  },
  {
    scanLogId: fixtureSafeScanLogId,
    createdAt: Date.UTC(2026, 2, 18, 9, 15),
    result: "pass",
    failureReasons: [],
    explanationStatus: "none",
    explanationText: undefined,
    explanationModel: undefined,
    scannedToken: "WRISTBAND-SAFE-QR-001",
    metadata: {
      scanType: "qr",
      deviceId: "ios-sim-admin-review",
    },
    scanner: {
      authUserId: "fixture-nurse-safe",
      displayName: "Nurse Sam Patel",
      email: "sam.patel@example.com",
    },
    patient: {
      _id: fixtureSafePatientId,
      mrn: "MRN-SAFE-001",
      displayName: "Demo Safe Patient",
      dob: "1990-01-01",
      allergyLabels: ["Latex allergy"],
    },
    medication: {
      _id: fixtureSafeMedicationId,
      displayName: "Acetaminophen 500mg",
      rxNormCode: "161",
      route: "PO",
      dose: "1 tablet",
      frequency: "BID",
    },
    wristband: {
      _id: fixtureSafeWristbandId,
      token: "WRISTBAND-SAFE-QR-001",
      tokenType: "qr",
      isActive: true,
    },
  },
];

const fixtureScanLogDetails: Record<string, AdminReviewDetail> = {
  [fixtureConflictScanLogId]: {
    scanLog: {
      _id: fixtureConflictScanLogId,
      _creationTime: Date.UTC(2026, 2, 19, 15, 30),
      authUserId: "fixture-nurse-conflict",
      patientId: fixtureConflictPatientId,
      wristbandId: fixtureConflictWristbandId,
      medicationId: fixtureConflictMedicationId,
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      result: "fail",
      failureReasons: ["allergy_conflict"],
      deterministicDecisionVersion: "v1",
      explanationStatus: "generated",
      explanationText:
        "The stored allergy list already flags penicillin, so the deterministic check blocked amoxicillin before administration.",
      explanationModel: "openai:gpt-4.1-mini",
      metadata: {
        scanType: "qr",
        deviceId: "ios-sim-admin-review",
      },
      createdAt: Date.UTC(2026, 2, 19, 15, 30),
    },
    scanner: {
      authUserId: "fixture-nurse-conflict",
      displayName: "Nurse Maya Chen",
      email: "maya.chen@example.com",
    },
    patient: {
      _id: fixtureConflictPatientId,
      _creationTime: Date.UTC(2026, 2, 18, 8, 0),
      mrn: "MRN-CONFLICT-001",
      displayName: "Demo Conflict Patient",
      dob: "1985-06-15",
      allergyCodes: ["SNOMED:294954006"],
      allergyLabels: ["Penicillin allergy"],
      isActive: true,
      createdAt: Date.UTC(2026, 2, 18, 8, 0),
      updatedAt: Date.UTC(2026, 2, 19, 15, 30),
    },
    medication: {
      _id: fixtureConflictMedicationId,
      _creationTime: Date.UTC(2026, 2, 18, 8, 5),
      patientId: fixtureConflictPatientId,
      displayName: "Amoxicillin 500mg",
      rxNormCode: "723",
      route: "PO",
      dose: "1 capsule",
      frequency: "BID",
      ingredientCodes: ["RXNORM:723"],
      contraindicationAllergyCodes: ["SNOMED:294954006"],
      isActive: true,
      createdAt: Date.UTC(2026, 2, 18, 8, 5),
      updatedAt: Date.UTC(2026, 2, 19, 15, 30),
    },
    wristband: {
      _id: fixtureConflictWristbandId,
      _creationTime: Date.UTC(2026, 2, 18, 8, 10),
      patientId: fixtureConflictPatientId,
      token: "WRISTBAND-CONFLICT-QR-001",
      tokenType: "qr",
      issuedAt: Date.UTC(2026, 2, 18, 8, 10),
      revokedAt: undefined,
      isActive: true,
    },
  },
  [fixtureSafeScanLogId]: {
    scanLog: {
      _id: fixtureSafeScanLogId,
      _creationTime: Date.UTC(2026, 2, 18, 9, 15),
      authUserId: "fixture-nurse-safe",
      patientId: fixtureSafePatientId,
      wristbandId: fixtureSafeWristbandId,
      medicationId: fixtureSafeMedicationId,
      scannedToken: "WRISTBAND-SAFE-QR-001",
      result: "pass",
      failureReasons: [],
      deterministicDecisionVersion: "v1",
      explanationStatus: "none",
      explanationText: undefined,
      explanationModel: undefined,
      metadata: {
        scanType: "qr",
        deviceId: "ios-sim-admin-review",
      },
      createdAt: Date.UTC(2026, 2, 18, 9, 15),
    },
    scanner: {
      authUserId: "fixture-nurse-safe",
      displayName: "Nurse Sam Patel",
      email: "sam.patel@example.com",
    },
    patient: {
      _id: fixtureSafePatientId,
      _creationTime: Date.UTC(2026, 2, 17, 11, 0),
      mrn: "MRN-SAFE-001",
      displayName: "Demo Safe Patient",
      dob: "1990-01-01",
      allergyCodes: ["SNOMED:91936005"],
      allergyLabels: ["Latex allergy"],
      isActive: true,
      createdAt: Date.UTC(2026, 2, 17, 11, 0),
      updatedAt: Date.UTC(2026, 2, 18, 9, 15),
    },
    medication: {
      _id: fixtureSafeMedicationId,
      _creationTime: Date.UTC(2026, 2, 17, 11, 5),
      patientId: fixtureSafePatientId,
      displayName: "Acetaminophen 500mg",
      rxNormCode: "161",
      route: "PO",
      dose: "1 tablet",
      frequency: "BID",
      ingredientCodes: ["RXNORM:161"],
      contraindicationAllergyCodes: ["SNOMED:300913006"],
      isActive: true,
      createdAt: Date.UTC(2026, 2, 17, 11, 5),
      updatedAt: Date.UTC(2026, 2, 18, 9, 15),
    },
    wristband: {
      _id: fixtureSafeWristbandId,
      _creationTime: Date.UTC(2026, 2, 17, 11, 10),
      patientId: fixtureSafePatientId,
      token: "WRISTBAND-SAFE-QR-001",
      tokenType: "qr",
      issuedAt: Date.UTC(2026, 2, 17, 11, 10),
      revokedAt: undefined,
      isActive: true,
    },
  },
};

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const fixtureMode = useAdminReviewFixtureMode();

  if (fixtureMode) {
    return <AdminReviewContent fixtureMode />;
  }

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
