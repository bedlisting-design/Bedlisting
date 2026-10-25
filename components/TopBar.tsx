import Link from "next/link";

// Support bar from the design (desktop only).
export default function TopBar() {
  return (
      <div className="hidden md:flex items-center justify-between bg-[#064e3b] px-6 py-1.5 text-xs text-white/90">
        <a href="tel:+2340000000000" className="flex items-center gap-1.5 hover:text-white">📞 +234 000 000 0000</a>
        <span>Nsukka · University of Nigeria campus area</span>
        <a href="mailto:support@bedlisting.com" className="hover:text-white">support@bedlisting.com</a>
      </div>

  
  );
}
