import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniLoader from "../components/MiniLoader";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "solutions", label: "Rituels" },
  { id: "addresses", label: "Adresses" },
  { id: "guides", label: "Nos guides" },
  { id: "pricing", label: "Tarifs" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openSolutions, setOpenSolutions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isAuthenticated, isAdmin, user } = useAuth();
  const isStaff = isAdmin || user?.role === "ESTHETICIENNE" || user?.role === "SUPERADMIN";

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 100);
  };

  const handleServiceClick = (slug: string) => {
    setOpenSolutions(false);
    setMobileOpen(false);
    navigate(`/soins/${slug}`);
  };

  const handleAuthClick = () => {
    setMobileOpen(false);
    if (isAuthenticated) {
      navigate("/profil");
    } else {
      navigate("/connexion");
    }
  };

  const handleSectionClick = (id: string) => {
    setMobileOpen(false);

    if (id === "pricing") {
      navigate("/tarifs");
      return;
    }

    // 👉 on passe toujours par la home avec un paramètre de section
    navigate(`/?section=${id}`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-black/70">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/logo-pee.png"
              alt="Logo Pure Éclat"
              onClick={handleLogoClick}
              className="h-16 w-auto cursor-pointer select-none logo-glow transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Links desktop */}
          <div className="hidden items-center gap-6 text-sm font-medium text-white md:flex relative">
            {/* Solutions */}
            <div
              className="relative"
              onMouseEnter={() => setOpenSolutions(true)}
              onMouseLeave={() => setOpenSolutions(false)}
            >
              <button
                onClick={() => { setOpenSolutions(false); navigate("/soins"); }}
                className="transition hover:text-rose-300"
              >
                Rituels
              </button>

              {/* Mega Menu */}
              <div
                className={`absolute left-1/2 top-full z-40 w-[750px]
                  -translate-x-1/2 rounded-2xl bg-black p-8 text-white
                  shadow-xl border border-white/10
                  ${openSolutions ? "block" : "hidden"}`}
              >
                <div className="grid grid-cols-3 gap-8 text-sm">
                  {/* Colonne visage */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-rose-300">
                      RITUELS VISAGE
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("rituel-eclat-signature")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Rituel Éclat Signature
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleServiceClick("hydra-glow")}
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Hydra Glow
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("peeling-doux-renovateur")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Peeling doux rénovateur
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("massage-sculptant")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Massage sculptant
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Colonne corps */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-rose-300">
                      SOINS CORPS
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("modelage-relaxant")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Modelage relaxant
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("enveloppement-raffermissant")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Enveloppement raffermissant
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("drainage-esthetique")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Drainage esthétique
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("soin-jambes-legeres")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Soin jambes légères
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Colonne regard */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-rose-300">
                      BEAUTÉ DU REGARD
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() => handleServiceClick("brow-lift")}
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Brow Lift
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("rehaussement-cils")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Rehaussement de cils
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("teinture-cils-sourcils")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Teinture cils &amp; sourcils
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("soin-contour-yeux")
                          }
                          className="w-full text-left hover:text-rose-300 transition"
                        >
                          Soin contour des yeux
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Autres liens */}
            {sections
              .filter((s) => s.id !== "solutions")
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSectionClick(s.id)}
                  className="transition hover:text-rose-300"
                >
                  {s.label}
                </button>
              ))}

            {/* Planning (staff uniquement) */}
            {isStaff && (
              <button
                onClick={() => navigate("/planning")}
                className="transition hover:text-rose-300"
              >
                Planning
              </button>
            )}
          </div>

          {/* CTA + Connexion desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate("/soins")}
              className="rounded-full border border-white/30 bg-white/10 backdrop-blur px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Prendre RDV
            </button>

            {/* Icône de compte */}
            <button
              onClick={handleAuthClick}
              title={isAuthenticated ? "Mon profil" : "Se connecter"}
              className="flex items-center justify-center p-1.5 rounded-full bg-white text-black shadow-md hover:bg-white/90 transition w-7 h-7 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill={isAuthenticated ? "#22c55e" : "currentColor"}
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Bouton menu mobile */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <div className="space-y-1.5 flex flex-col items-center justify-center w-5">
              <span className={`block h-px w-5 bg-white origin-center transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
              <span className={`block h-px bg-white transition-all duration-300 ${mobileOpen ? "w-0 opacity-0" : "w-3.5"}`} />
              <span className={`block h-px w-5 bg-white origin-center transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[3px]" : ""}`} />
            </div>
          </button>
        </nav>
      </header>

      {/* Overlay sombre */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Panneau mobile plein écran (slide depuis la droite) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-[#0d0d0d] text-white transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header panneau */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <img
            src="/images/logo-pee.png"
            alt="Logo Pure Éclat"
            className="h-12 w-auto"
            onClick={() => { setMobileOpen(false); handleLogoClick(); }}
          />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Navigation principale */}
          <nav className="space-y-1">
            <button
              onClick={() => { setMobileOpen(false); navigate("/soins"); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-white hover:bg-white/8 transition"
            >
              Tous les soins
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            {sections.filter((s) => s.id !== "solutions").map((s) => (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-white hover:bg-white/8 transition"
              >
                {s.label}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
            {isStaff && (
              <button
                onClick={() => { setMobileOpen(false); navigate("/planning"); }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-rose-300 hover:bg-white/8 transition"
              >
                Planning
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )}
          </nav>

        </div>

        {/* Footer CTA */}
        <div className="border-t border-white/10 px-6 py-5 space-y-3">
          <button
            onClick={() => { setMobileOpen(false); navigate("/soins"); }}
            className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
          >
            Prendre rendez-vous
          </button>
          <button
            onClick={handleAuthClick}
            className="w-full rounded-full border border-white/20 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
          >
            {isAuthenticated ? "Mon profil" : "Se connecter"}
          </button>
        </div>
      </div>

      {loading && <MiniLoader />}
    </>
  );
}
