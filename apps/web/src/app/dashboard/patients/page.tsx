"use client";

import { api } from "@meditag/backend/convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserMenu from "@/components/user-menu";

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function NewPatientForm({ onClose }: { onClose: () => void }) {
  const createPatient = useMutation(api.patients.create);
  const [mrn, setMrn] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [allergies, setAllergies] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mrn.trim() || !displayName.trim() || !dob) {
      toast.error("MRN, name, and DOB are required.");
      return;
    }
    const allergyList = splitCsv(allergies);
    setSubmitting(true);
    try {
      await createPatient({
        mrn: mrn.trim(),
        displayName: displayName.trim(),
        dob,
        allergyCodes: allergyList,
        allergyLabels: allergyList,
      });
      toast.success("Patient created");
      onClose();
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? ((error.data as { message?: string })?.message ?? "Failed to create patient.")
          : "Failed to create patient.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="patient-mrn">MRN</Label>
            <Input
              id="patient-mrn"
              value={mrn}
              onChange={(event) => setMrn(event.target.value)}
              placeholder="MRN-001"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="patient-name">Display name</Label>
            <Input
              id="patient-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="patient-dob">Date of birth</Label>
            <Input
              id="patient-dob"
              type="date"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="patient-allergies">Allergies (comma-separated)</Label>
            <Input
              id="patient-allergies"
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
              placeholder="Penicillin, Latex"
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Create patient"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PatientsContent() {
  const [showForm, setShowForm] = useState(false);
  const patients = useQuery(api.patients.list, { includeInactive: true });

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
            <p className="text-muted-foreground text-sm">
              Manage patient records, medications, and wristband assignments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowForm((value) => !value)}>
              {showForm ? "Close form" : "New patient"}
            </Button>
            <UserMenu />
          </div>
        </div>

        {showForm ? <NewPatientForm onClose={() => setShowForm(false)} /> : null}

        <Card>
          <CardContent className="px-0 pt-6 sm:px-4">
            {patients === undefined ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>
            ) : patients.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                No patients yet. Create one to get started.
              </p>
            ) : (
              <div className="grid gap-2">
                {patients.map((patient) => (
                  <Link
                    key={patient._id}
                    href={`/dashboard/patients/${patient._id}`}
                    className="border-border/60 bg-background hover:bg-muted/40 grid gap-2 rounded-md border px-4 py-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium">{patient.displayName}</span>
                      <span className="text-muted-foreground text-xs">MRN {patient.mrn}</span>
                      <span className="text-muted-foreground text-xs">DOB {patient.dob}</span>
                      {!patient.isActive ? (
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Allergies:{" "}
                      {patient.allergyLabels.length > 0
                        ? patient.allergyLabels.join(", ")
                        : "None recorded"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function AuthenticatedPatients() {
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
          <CardContent>
            <p className="text-muted-foreground text-sm">This view is limited to administrators.</p>
          </CardContent>
        </Card>
      </Shell>
    );
  }
  return <PatientsContent />;
}

function UnauthenticatedView() {
  const [showSignIn, setShowSignIn] = useState(true);
  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage patients</CardTitle>
          </CardHeader>
        </Card>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </Shell>
  );
}

export default function PatientsPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedPatients />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedView />
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
