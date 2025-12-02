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

  const handleLogoClick = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 100); // tu peux mettre 200 / 300 / 500 ms
  };

  const handleServiceClick = (slug: string) => {
    navigate(`/soins/${slug}`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-transparent backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/logo-pee.png"
              alt="Logo Pure Éclat"
              onClick={handleLogoClick}
              className="h-20 w-auto select-none cursor-pointer"
            />
          </div>

          {/* Links */}
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-100 md:flex relative">
            {/* Bouton Solutions avec mega menu */}
            <div className="group relative">
              <button className="transition hover:text-white">Solutions</button>

              {/* Mega Menu */}
              <div className="absolute left-1/2 top-full z-40 hidden w-[750px] -translate-x-1/2 rounded-2xl bg-white p-8 text-slate-900 shadow-xl group-hover:block">
                <div className="grid grid-cols-3 gap-8 text-sm">
                  {/* Colonne visage */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-500">
                      RITUELS VISAGE
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("rituel-eclat-signature")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Rituel Éclat Signature
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleServiceClick("hydra-glow")}
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Hydra Glow
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("peeling-doux-renovateur")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Peeling doux rénovateur
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("massage-sculptant")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Massage sculptant
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Colonne corps */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-500">
                      SOINS CORPS
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("modelage-relaxant")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Modelage relaxant
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("enveloppement-raffermissant")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Enveloppement raffermissant
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("drainage-esthetique")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Drainage esthétique
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("soin-jambes-legeres")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Soin jambes légères
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Colonne regard */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-500">
                      BEAUTÉ DU REGARD
                    </h3>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <button
                          onClick={() => handleServiceClick("brow-lift")}
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Brow Lift
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("rehaussement-cils")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Rehaussement de cils
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("teinture-cils-sourcils")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Teinture cils &amp; sourcils
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleServiceClick("soin-contour-yeux")
                          }
                          className="w-full text-left hover:text-rose-500 transition cursor-pointer"
                        >
                          Soin contour des yeux
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Les autres liens */}
            {sections
              .filter((s) => s.id !== "solutions")
              .map((s) => (
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

      {/* Loader plein écran */}
      {loading && <MiniLoader />}
    </>
  );
}
