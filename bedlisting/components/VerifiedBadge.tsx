// Blue check shown next to the name of a landlord or agent whose ID bedlisting
// has reviewed and approved. It only ever means "identity document checked".
export default function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <span
      title={`${label}: bedlisting has checked this person's ID document. This is not a guarantee of any transaction.`}
      className="ml-1 inline-flex items-center gap-1 align-middle text-xs font-medium text-blue-600"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M10 1l2.2 1.6 2.7-.1.9 2.6 2.2 1.6-.8 2.6.8 2.6-2.2 1.6-.9 2.6-2.7-.1L10 19l-2.2-1.6-2.7.1-.9-2.6L2 13.3l.8-2.6L2 8.1l2.2-1.6.9-2.6 2.7.1L10 1zm-1.2 11.4l4.4-4.4-1.1-1.1-3.3 3.3-1.5-1.5-1.1 1.1 2.6 2.6z" />
      </svg>
      {label}
    </span>
  );
}
