"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RoommateSafety from "@/components/RoommateSafety";

export type RoommateFormInitial = {
  mode: "NEED_ROOM" | "HAVE_ROOM";
  gender: "MALE" | "FEMALE" | "OTHER";
  genderPref: "ANY" | "SAME";
  area: string;
  budgetMin: string;
  budgetMax: string;
  moveDate: string;
  sleep: "EARLY" | "NIGHT" | "FLEXIBLE";
  cleanliness: number;
  smokes: boolean;
  smokingOk: boolean;
  visitors: "RARELY" | "SOMETIMES" | "OFTEN";
  bio: string;
  roomDetails: string;
  active: boolean;
};

export const blankRoommate: RoommateFormInitial = {
  mode: "NEED_ROOM", gender: "MALE", genderPref: "SAME", area: "", budgetMin: "", budgetMax: "",
  moveDate: "", sleep: "FLEXIBLE", cleanliness: 3, smokes: false, smokingOk: false,
  visitors: "SOMETIMES", bio: "", roomDetails: "", active: true,
};

const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default function RoommateProfileForm({ initial, editing }: { initial?: RoommateFormInitial; editing: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<RoommateFormInitial>(initial ?? blankRoommate);
  const [confirm18, setConfirm18] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof RoommateFormInitial>(k: K, v: RoommateFormInitial[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/roommates/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        budgetMin: Number(f.budgetMin),
        budgetMax: Number(f.budgetMax),
        confirm18,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Could not save your profile.");
    router.push("/roommates");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete your roommate profile?")) return;
    await fetch("/api/roommates/profile", { method: "DELETE" });
    router.push("/roommates");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{editing ? "Your roommate profile" : "Create your roommate profile"}</h1>
      <p className="text-sm text-neutral-500">
        Other people see your first name and last initial, never your contact details or a photo.
      </p>

      <div className="flex rounded-md border border-neutral-300 p-1">
        {([["NEED_ROOM", "I need a room"], ["HAVE_ROOM", "I have a room to share"]] as const).map(([v, label]) => (
          <button key={v} type="button" onClick={() => set("mode", v)}
            className={`flex-1 rounded py-2 text-sm ${f.mode === v ? "bg-brand-600 text-white" : "text-neutral-600"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">I am
          <select value={f.gender} onChange={(e) => set("gender", e.target.value as RoommateFormInitial["gender"])} className={input}>
            <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
          </select>
        </label>
        <label className="text-sm">I will share with
          <select value={f.genderPref} onChange={(e) => set("genderPref", e.target.value as RoommateFormInitial["genderPref"])} className={input}>
            <option value="SAME">Same gender only</option><option value="ANY">Anyone</option>
          </select>
        </label>
      </div>

      <input required className={input} placeholder="Area (for example Hilltop, Nsukka)" value={f.area} onChange={(e) => set("area", e.target.value)} />

      <div>
        <p className="mb-1 text-sm">Your budget per year, just your share (₦)</p>
        <div className="flex gap-2">
          <input required type="number" min={0} className={input} placeholder="From" value={f.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
          <input required type="number" min={0} className={input} placeholder="To" value={f.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
        </div>
      </div>

      <label className="block text-sm">Ready to move in around
        <input type="date" className={input} value={f.moveDate} onChange={(e) => set("moveDate", e.target.value)} />
      </label>

      <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium">Lifestyle</legend>
        <label className="block text-sm">Sleep
          <select value={f.sleep} onChange={(e) => set("sleep", e.target.value as RoommateFormInitial["sleep"])} className={input}>
            <option value="EARLY">Early to bed</option><option value="NIGHT">Night owl</option><option value="FLEXIBLE">Flexible</option>
          </select>
        </label>
        <label className="block text-sm">Tidiness: {f.cleanliness} of 5 (1 relaxed, 5 very tidy)
          <input type="range" min={1} max={5} value={f.cleanliness} onChange={(e) => set("cleanliness", Number(e.target.value))} className="w-full" />
        </label>
        <label className="block text-sm">Visitors
          <select value={f.visitors} onChange={(e) => set("visitors", e.target.value as RoommateFormInitial["visitors"])} className={input}>
            <option value="RARELY">Rarely</option><option value="SOMETIMES">Sometimes</option><option value="OFTEN">Often</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.smokes} onChange={(e) => set("smokes", e.target.checked)} /> I smoke
        </label>
        {!f.smokes && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.smokingOk} onChange={(e) => set("smokingOk", e.target.checked)} /> I am fine sharing with someone who smokes
          </label>
        )}
      </fieldset>

      <textarea className={input} rows={3} maxLength={500} placeholder="A little about you (course, habits, what you are looking for)" value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      {f.mode === "HAVE_ROOM" && (
        <textarea className={input} rows={3} maxLength={500} placeholder="About the room (size, rent split, amenities). Do not give the exact address." value={f.roomDetails} onChange={(e) => set("roomDetails", e.target.value)} />
      )}

      {editing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Show my profile in other people’s matches
        </label>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={confirm18} onChange={(e) => setConfirm18(e.target.checked)} />
        <span>I am 18 or over and I agree to the Terms.</span>
      </label>

      <RoommateSafety />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button disabled={loading} className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Saving..." : editing ? "Save profile" : "Create profile and see matches"}
      </button>
      {editing && (
        <button type="button" onClick={remove} className="w-full text-sm text-red-600 underline">Delete my profile</button>
      )}
    </form>
  );
}
