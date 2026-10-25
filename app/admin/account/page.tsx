import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function AdminAccountPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold">Admin account</h1>
      <p className="mb-6 text-sm text-neutral-500">Change your admin password.</p>
      <ChangePasswordForm minLength={12} />
    </div>
  );
}
