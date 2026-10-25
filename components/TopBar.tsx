// Slim green strip above the header: a short promise on every screen size,
// plus contact details on wider screens.
export default function TopBar() {
  return (
    <div className="bg-[#064e3b] px-4 py-2 text-xs text-white/90 md:px-6 md:py-1.5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 md:justify-between">
        <a href="mailto:support@bedlisting.com" className="hidden hover:text-white md:inline">support@bedlisting.com</a>
        <span className="text-center">✨ Verified off-campus student lodges in Nsukka. No fake listings!</span>
        <span className="hidden md:inline">Nsukka · University of Nigeria campus area</span>
      </div>
    </div>
  );
}
