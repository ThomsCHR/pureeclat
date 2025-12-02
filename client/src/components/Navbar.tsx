const sections = [
  { id: "needs", label: "Besoins" },
  { id: "solutions", label: "Solutions" },
  { id: "addresses", label: "Adresses" },
  { id: "about", label: "À propos" },
  { id: "guides", label: "Nos guides" },
  { id: "pricing", label: "Tarifs" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-transparent backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1">

        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/images/logo-pee.png"
            alt="Logo Pure Éclat"
            className="h-20 w-auto select-none cursor-pointer"
          />
        </div>

        {/* Links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-100 md:flex">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                const el = document.getElementById(s.id);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="transition hover:text-white"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-full border border-white/40 bg-white/20 backdrop-blur px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-white/30">
            Offrir une carte cadeau
          </button>
          <button className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-xs font-semibold text-slate-900 shadow-lg transition hover:bg-white">
            <span>Prendre rdv</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
              →
            </span>
          </button>
        </div>

        {/* Mobile menu */}
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 backdrop-blur border border-white/40 md:hidden">
          <div className="space-y-1">
            <span className="block h-0.5 w-4 bg-white" />
            <span className="block h-0.5 w-4 bg-white" />
          </div>
        </button>

      </nav>
    </header>
  );
}
