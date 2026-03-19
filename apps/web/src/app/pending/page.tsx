export default function PendingPage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Account pending approval</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your account was created successfully, but no role has been assigned yet.
          Please wait for an admin to approve your access.
        </p>
      </div>
    </main>
  );
}