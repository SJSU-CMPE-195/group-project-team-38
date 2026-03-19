"use client";

import { api } from "@meditag/backend/convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import UserMenu from "@/components/user-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">{children}</div>;
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
  const scanLogs = useQuery(api.scanLogs.listForAdminReview, { limit: 25 });

  const totalCount = scanLogs?.length ?? 0;
  const passCount = scanLogs?.filter((scanLog) => scanLog.result === "pass").length ?? 0;
  const failCount = scanLogs?.filter((scanLog) => scanLog.result === "fail").length ?? 0;

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

        <Card>
          <CardHeader>
            <CardTitle>Scan log list</CardTitle>
            <CardDescription>
              Stable first-pass review surface with result, patient, medication, timing, and
              explanation state.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-4">
            {scanLogs === undefined ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                Loading recent scan events…
              </div>
            ) : scanLogs.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No scan events yet. Complete a medication scan in the native app to populate this
                review list.
              </div>
            ) : (
              <div className="grid gap-3">
                {scanLogs.map((scanLog) => {
                  const failureSummary =
                    scanLog.failureReasons.length > 0
                      ? scanLog.failureReasons
                          .map((reason) => failureReasonLabel[reason])
                          .join(", ")
                      : "No failure reasons";

                  return (
                    <article
                      key={scanLog.scanLogId}
                      className="border-border/80 bg-background grid gap-4 border px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge result={scanLog.result} />
                          <InfoBadge label={explanationStatusLabel[scanLog.explanationStatus]} />
                          <InfoBadge label={scanLog.metadata.scanType.toUpperCase()} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Verified {dateTimeFormatter.format(scanLog.createdAt)}
                        </p>
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
                            scanLog.scanner.displayName ?? scanLog.scanner.email ?? "Unknown user"
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
                          value={scanLog.result === "pass" ? "Medication cleared" : failureSummary}
                          detail={scanLog.wristband?.token ?? scanLog.scannedToken}
                        />
                      </dl>

                      {scanLog.explanationText ? (
                        <div className="bg-muted/60 border-l-2 border-sky-600 px-3 py-2 text-sm">
                          <p className="font-medium">Explanation</p>
                          <p className="text-muted-foreground mt-1">{scanLog.explanationText}</p>
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
      <dd className="font-medium">{value}</dd>
      <dd className="text-muted-foreground">{detail}</dd>
    </div>
  );
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
