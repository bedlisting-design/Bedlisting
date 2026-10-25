import { maskName } from "@/lib/format";
import { MODE_LABEL, GENDER_LABEL, SLEEP_LABEL, VISITORS_LABEL } from "@/lib/roommates";
import { ROOMMATE_CONNECT_COST } from "@/lib/pricing";
import ConnectButton, { ConnectState } from "@/components/ConnectButton";
import ReportButton from "@/components/ReportButton";

type Props = {
  userId: string;
  name: string;
  profile: {
    mode: string; gender: string; area: string; budgetMin: number; budgetMax: number;
    moveDate: Date | null; sleep: string; cleanliness: number; smokes: boolean;
    visitors: string; bio: string | null; roomDetails: string | null;
  };
  score: number;
  reasons: string[];
  state: ConnectState;
  connectionId?: string;
};

export default function RoommateCard({ userId, name, profile: p, score, reasons, state, connectionId }: Props) {
  const chip = "rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700";
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{maskName(name)}</p>
          <p className="text-sm text-neutral-500">{MODE_LABEL[p.mode]} · {GENDER_LABEL[p.gender]}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">{score}% match</span>
      </div>

      <p className="mt-3 text-sm">📍 {p.area}</p>
      <p className="text-sm">💰 ₦{p.budgetMin.toLocaleString()} to ₦{p.budgetMax.toLocaleString()} a year</p>
      {p.moveDate && <p className="text-sm">📅 Moving in around {p.moveDate.toLocaleDateString()}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={chip}>{SLEEP_LABEL[p.sleep]}</span>
        <span className={chip}>Tidiness {p.cleanliness}/5</span>
        <span className={chip}>{p.smokes ? "Smokes" : "Non-smoker"}</span>
        <span className={chip}>{VISITORS_LABEL[p.visitors]}</span>
      </div>

      {reasons.length > 0 && (
        <p className="mt-3 text-xs text-brand-700">Why you match: {reasons.join(" · ")}</p>
      )}
      {p.bio && <p className="mt-3 text-sm text-neutral-700">{p.bio}</p>}
      {p.roomDetails && <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-medium">The room: </span>{p.roomDetails}</p>}

      <div className="mt-auto pt-4">
        <ConnectButton targetUserId={userId} cost={ROOMMATE_CONNECT_COST} state={state} connectionId={connectionId} />
        <div className="mt-2 text-center">
          <ReportButton reportedUserId={userId} person />
        </div>
      </div>
    </div>
  );
}
