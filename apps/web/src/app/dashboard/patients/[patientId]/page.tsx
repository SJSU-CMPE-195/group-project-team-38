"use client";

import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserMenu from "@/components/user-menu";

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">{children}</div>;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof ConvexError) {
    return (error.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}

function PatientEditor({ patientId }: { patientId: Id<"patients"> }) {
  const patient = useQuery(api.patients.getById, { patientId });
  const updatePatient = useMutation(api.patients.update);

  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [allergies, setAllergies] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (patient && !hydrated) {
      setDisplayName(patient.displayName);
      setDob(patient.dob);
      setAllergies(patient.allergyLabels.join(", "));
      setIsActive(patient.isActive);
      setHydrated(true);
    }
  }, [patient, hydrated]);

  if (patient === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading…</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  if (patient === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const allergyList = splitCsv(allergies);
      await updatePatient({
        patientId,
        displayName: displayName.trim(),
        dob,
        allergyCodes: allergyList,
        allergyLabels: allergyList,
        isActive,
      });
      toast.success("Patient updated");
    } catch (error) {
      toast.error(describeError(error, "Failed to update patient."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Patient</CardTitle>
          <span className="text-muted-foreground text-xs">MRN {patient.mrn}</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-dob">Date of birth</Label>
            <Input
              id="edit-dob"
              type="date"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="edit-allergies">Allergies (comma-separated)</Label>
            <Input
              id="edit-allergies"
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
              placeholder="Penicillin, Latex"
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MedicationsSection({ patientId }: { patientId: Id<"patients"> }) {
  const medications = useQuery(api.medications.listByPatient, {
    patientId,
    includeInactive: true,
  });
  const createMedication = useMutation(api.medications.create);
  const deactivateMedication = useMutation(api.medications.deactivate);

  const [showForm, setShowForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [rxNormCode, setRxNormCode] = useState("");
  const [route, setRoute] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [ingredientCodes, setIngredientCodes] = useState("");
  const [contraindicationAllergyCodes, setContraindicationAllergyCodes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDisplayName("");
    setRxNormCode("");
    setRoute("");
    setDose("");
    setFrequency("");
    setIngredientCodes("");
    setContraindicationAllergyCodes("");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim() || !rxNormCode.trim()) {
      toast.error("Display name and RxNorm code are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createMedication({
        patientId,
        displayName: displayName.trim(),
        rxNormCode: rxNormCode.trim(),
        route: route.trim() || undefined,
        dose: dose.trim() || undefined,
        frequency: frequency.trim() || undefined,
        ingredientCodes: splitCsv(ingredientCodes),
        contraindicationAllergyCodes: splitCsv(contraindicationAllergyCodes),
      });
      toast.success("Medication added");
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(describeError(error, "Failed to create medication."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (medicationId: Id<"medications">) => {
    try {
      await deactivateMedication({ medicationId });
      toast.success("Medication deactivated");
    } catch (error) {
      toast.error(describeError(error, "Failed to deactivate medication."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Medications</CardTitle>
          <Button size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Close" : "Add medication"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {showForm ? (
          <form onSubmit={handleCreate} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="med-name">Display name</Label>
              <Input
                id="med-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Amoxicillin 500mg"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="med-rxnorm">RxNorm code</Label>
              <Input
                id="med-rxnorm"
                value={rxNormCode}
                onChange={(event) => setRxNormCode(event.target.value)}
                placeholder="723"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="med-route">Route</Label>
              <Input
                id="med-route"
                value={route}
                onChange={(event) => setRoute(event.target.value)}
                placeholder="PO"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="med-dose">Dose</Label>
              <Input
                id="med-dose"
                value={dose}
                onChange={(event) => setDose(event.target.value)}
                placeholder="1 tablet"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="med-frequency">Frequency</Label>
              <Input
                id="med-frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value)}
                placeholder="BID"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="med-ingredients">Ingredient codes</Label>
              <Input
                id="med-ingredients"
                value={ingredientCodes}
                onChange={(event) => setIngredientCodes(event.target.value)}
                placeholder="RXNORM:723"
              />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="med-contraindications">Contraindication allergy codes</Label>
              <Input
                id="med-contraindications"
                value={contraindicationAllergyCodes}
                onChange={(event) => setContraindicationAllergyCodes(event.target.value)}
                placeholder="Penicillin"
              />
              <p className="text-muted-foreground text-xs">
                Must match a value from the patient&apos;s allergies for the conflict check to fire.
              </p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save medication"}
              </Button>
            </div>
          </form>
        ) : null}

        {medications === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : medications.length === 0 ? (
          <p className="text-muted-foreground text-sm">No medications recorded.</p>
        ) : (
          <div className="grid gap-2">
            {medications.map((medication) => (
              <div
                key={medication._id}
                className="border-border/60 grid gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">{medication.displayName}</span>
                  <span className="text-muted-foreground text-xs">
                    RxNorm {medication.rxNormCode}
                  </span>
                  {!medication.isActive ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      Inactive
                    </span>
                  ) : null}
                  {medication.isActive ? (
                    <Button
                      size="xs"
                      variant="outline"
                      className="ml-auto"
                      onClick={() => handleDeactivate(medication._id)}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {[medication.dose, medication.route, medication.frequency]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </p>
                {medication.contraindicationAllergyCodes.length > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Contraindications: {medication.contraindicationAllergyCodes.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WristbandsSection({ patientId }: { patientId: Id<"patients"> }) {
  const wristbands = useQuery(api.wristbands.listByPatient, {
    patientId,
    includeInactive: true,
  });
  const assignWristband = useMutation(api.wristbands.assign);
  const deactivateWristband = useMutation(api.wristbands.deactivate);

  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState("");
  const [tokenType, setTokenType] = useState<"qr" | "nfc">("qr");
  const [submitting, setSubmitting] = useState(false);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token.trim()) {
      toast.error("Token is required.");
      return;
    }
    setSubmitting(true);
    try {
      await assignWristband({ patientId, token: token.trim(), tokenType });
      toast.success("Wristband assigned");
      setToken("");
      setTokenType("qr");
      setShowForm(false);
    } catch (error) {
      toast.error(describeError(error, "Failed to assign wristband."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (wristbandId: Id<"wristbands">) => {
    try {
      await deactivateWristband({ wristbandId });
      toast.success("Wristband deactivated");
    } catch (error) {
      toast.error(describeError(error, "Failed to deactivate wristband."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Wristbands</CardTitle>
          <Button size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Close" : "Assign wristband"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {showForm ? (
          <form
            onSubmit={handleAssign}
            className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_8rem_auto]"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="wristband-token">Token</Label>
              <Input
                id="wristband-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="WRISTBAND-ABC-001"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wristband-type">Type</Label>
              <select
                id="wristband-type"
                value={tokenType}
                onChange={(event) => setTokenType(event.target.value as "qr" | "nfc")}
                className="border-input bg-background h-8 rounded-md border px-2.5 text-xs outline-none"
              >
                <option value="qr">QR</option>
                <option value="nfc">NFC</option>
              </select>
            </div>
            <div className="self-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Assign"}
              </Button>
            </div>
          </form>
        ) : null}

        {wristbands === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : wristbands.length === 0 ? (
          <p className="text-muted-foreground text-sm">No wristbands assigned.</p>
        ) : (
          <div className="grid gap-2">
            {wristbands.map((wristband) => (
              <div
                key={wristband._id}
                className="border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
              >
                <span className="text-sm font-medium">{wristband.token}</span>
                <span className="text-muted-foreground text-xs uppercase">
                  {wristband.tokenType}
                </span>
                {!wristband.isActive ? (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    Revoked
                  </span>
                ) : null}
                {wristband.isActive ? (
                  <Button
                    size="xs"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => handleDeactivate(wristband._id)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatientDetail({ patientId }: { patientId: Id<"patients"> }) {
  return (
    <Shell>
      <div className="grid gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard/patients"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to patients
          </Link>
          <UserMenu />
        </div>
        <PatientEditor patientId={patientId} />
        <MedicationsSection patientId={patientId} />
        <WristbandsSection patientId={patientId} />
      </div>
    </Shell>
  );
}

function AuthenticatedDetail({ patientId }: { patientId: Id<"patients"> }) {
  const role = useQuery(api.users.getCurrentUserRole);
  if (role === undefined) {
    return (
      <Shell>
        <Card className="max-w-md border-dashed">
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
        </Card>
      </Shell>
    );
  }
  if (role !== "admin") {
    return (
      <Shell>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Admin access only</CardTitle>
          </CardHeader>
        </Card>
      </Shell>
    );
  }
  return <PatientDetail patientId={patientId} />;
}

export default function PatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId as Id<"patients">;
  return (
    <>
      <Authenticated>
        <AuthenticatedDetail patientId={patientId} />
      </Authenticated>
      <Unauthenticated>
        <Shell>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInForm onSwitchToSignUp={() => undefined} />
            </CardContent>
          </Card>
        </Shell>
      </Unauthenticated>
      <AuthLoading>
        <Shell>
          <Card className="max-w-md border-dashed">
            <CardHeader>
              <CardTitle>Loading…</CardTitle>
            </CardHeader>
          </Card>
        </Shell>
      </AuthLoading>
    </>
  );
}
