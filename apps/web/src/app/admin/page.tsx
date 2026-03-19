"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";

export default function AdminDashboardPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  const role = useQuery(
    api.users.getCurrentUserRole,
    isAuthenticated ? {} : "skip"
  );

  const patients = useQuery(
    api.patients.list,
    role === "admin" ? { includeInactive: false } : "skip"
  );

  const scanLogs = useQuery(
    api.verification.getRecentScanLogs,
    role === "admin" ? { limit: 10 } : "skip"
  );

  if (isLoading || role === undefined) {
    return <main className="p-6">Loading...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="p-6">
        <Link href="/login">Go to Login</Link>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="p-6">
        <div>Access denied. Current role: {String(role)}</div>
      </main>
    );
  }

  if (patients === undefined || scanLogs === undefined) {
    return <main className="p-6">Loading dashboard data...</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <p className="mt-2">Patients: {patients.length}</p>
      <p>Recent logs: {scanLogs.length}</p>
    </main>
  );
}