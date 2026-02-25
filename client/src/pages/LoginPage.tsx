import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { apiLogin } from "../api/apiClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const data = await apiLogin(email, password, rememberMe);
      login(data.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de vous connecter pour le moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5ED] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2 items-stretch rounded-3xl bg-white/80 shadow-xl border border-[#f0dfd0] overflow-hidden">
        {/* Colonne gauche : visuel / branding */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-black via-[#1a1412] to-black text-white p-8 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#f9b6c8_0,_transparent_60%)]" />

          <div className="relative space-y-6">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition"
            >
              ← Retour au site
            </button>

            <div className="space-y-3">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-rose-200/80">
                espace client
              </p>
              <h1 className="text-3xl font-semibold">Pure Éclat</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Accédez à votre espace pour gérer vos rendez-vous, vos rituels
                préférés et vos recommandations personnalisées.
              </p>
            </div>
          </div>

          <div className="relative space-y-3 text-xs text-white/60">
            <p>• Consultation de vos prochains rendez-vous</p>
            <p>• Historique de vos soins & recommandations</p>
            <p>• Accès privilégié aux offres Pure Éclat</p>
          </div>
        </div>

        {/* Colonne droite : formulaire */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="mb-6 md:mb-8 md:hidden">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition"
            >
              ← Retour au site
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Connexion à votre espace
            </h2>
            <p className="text-sm text-slate-600">
              Heureux de vous revoir. Entrez vos identifiants pour accéder à vos
              soins.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                placeholder="vous@email.com"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/mot-de-passe-oublie")}
                  className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                placeholder="Votre mot de passe"
              />
            </div>

            {/* Souvenir */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-black focus:ring-black"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
            </button>
          </form>

          {/* Bas de carte */}
          <div className="mt-6 text-xs text-slate-500">
            <p>
              Vous n&apos;avez pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => navigate("/inscription")}
                className="font-medium text-slate-800 underline underline-offset-2 hover:text-black"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
