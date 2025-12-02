import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniLoader from "../components/MiniLoader";
import { useAuth } from "../hooks/useAuth";

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

  // ✅ on utilise ton hook d'auth
  const { isAuthenticated, } = useAuth();

  const handleLogoClick = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 100);
  };

  const handleServiceClick = (slug: string) => {
    setOpenSolutions(false);
    navigate(`/soins/${slug}`);
  };

const handleAuthClick = () => {
  if (isAuthenticated) {
    // 🔹 Quand connecté → aller vers le profil
    navigate("/profil");
  } else {
    // 🔹 Quand pas connecté → aller vers la page de connexion
    navigate("/connexion");
  }
};


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
                // 🟢 Icône verte si connecté
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
