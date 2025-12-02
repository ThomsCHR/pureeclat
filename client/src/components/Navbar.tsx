import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniLoader from "../components/MiniLoader";

const sections = [
  { id: "solutions", label: "Solutions" },
  { id: "addresses", label: "Adresses" },
  { id: "about", label: "À propos" },
  { id: "guides", label: "Nos guides" },
  { id: "pricing", label: "Tarifs" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openSolutions, setOpenSolutions] = useState(false);

  // TODO: remplace ça par ton vrai état d’auth (contexte, Redux, etc.)
  const isAuthenticated = false;

  const handleLogoClick = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 100);
  };

  const handleServiceClick = (slug: string) => {
    setOpenSolutions(false); // ← ferme le mega-menu
    navigate(`/soins/${slug}`);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // TODO: log out (clear token, appel API, etc.)
      console.log("Déconnexion…");
    } else {
      navigate("/connexion"); // ou /login selon ta route
    }
  };

  const authLabel = isAuthenticated ? "Déconnexion" : "Connexion";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-black/70 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/logo-pee.png"
              alt="Logo Pure Éclat"
              onClick={handleLogoClick}
              className="h-16 w-auto cursor-pointer select-none"
            />
          </div>

          {/* Links */}
          <div className="hidden items-center gap-6 text-sm font-medium text-white md:flex relative">
            {/* Solutions */}
            <div
              className="relative"
              onMouseEnter={() => setOpenSolutions(true)}
              onMouseLeave={() => setOpenSolutions(false)}
            >
              <button className="transition hover:text-rose-300">
                Solutions
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
                  onClick={() => {
                    const el = document.getElementById(s.id);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="transition hover:text-rose-300"
                >
                  {s.label}
                </button>
              ))}
          </div>

          {/* CTA + Connexion */}
          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-full border border-white/30 bg-white/10 backdrop-blur px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20">
              Offrir une carte cadeau
            </button>

            <button className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow-lg transition hover:bg-slate-100">
              <span>Prendre RDV</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
                →
              </span>
            </button>

            {/* Bouton Connexion / Déconnexion stylé */}
            <div className="relative group">
              <div className="relative w-40 h-10 opacity-90 overflow-hidden rounded-xl bg-black z-10">
                <div
                  className="absolute z-10 -translate-x-44 group-hover:translate-x-[30rem] 
                             ease-in transition-all duration-700 h-full w-44 
                             bg-gradient-to-r from-gray-500 to-white/10 opacity-30 
                             -skew-x-12"
                />
                <div
                  className="absolute flex items-center justify-center text-white z-[1] 
                             opacity-90 rounded-xl inset-0.5 bg-black"
                >
                  <button
                    name="auth"
                    onClick={handleAuthClick}
                    className="font-semibold text-sm h-full w-full px-4 py-2 rounded-xl bg-black"
                  >
                    {authLabel}
                  </button>
                </div>
                <div
                  className="absolute duration-1000 group-hover:animate-spin 
                             w-full h-[100px] bg-gradient-to-r from-green-500 
                             to-yellow-500 blur-[30px]"
                />
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 md:hidden">
            <div className="space-y-1">
              <span className="block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
            </div>
          </button>
        </nav>
      </header>

      {loading && <MiniLoader />}
    </>
  );
}
