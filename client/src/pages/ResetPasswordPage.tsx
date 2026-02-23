import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiResetPassword } from "../api/apiClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien invalide. Veuillez refaire une demande.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await apiResetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5ED] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2 items-stretch rounded-3xl bg-white/80 shadow-xl border border-[#f0dfd0] overflow-hidden">
        {/* Colonne gauche */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-black via-[#1a1412] to-black text-white p-8 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#f9b6c8_0,_transparent_60%)]" />
          <div className="relative space-y-6">
            <button
              onClick={() => navigate("/connexion")}
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition"
            >
              ← Retour à la connexion
            </button>
            <div className="space-y-3">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-rose-200/80">
                nouveau mot de passe
              </p>
              <h1 className="text-3xl font-semibold">Pure Éclat</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Choisissez un nouveau mot de passe sécurisé pour votre espace client.
              </p>
            </div>
          </div>
          <div className="relative space-y-3 text-xs text-white/60">
            <p>• Minimum 8 caractères</p>
            <p>• Le lien n'est utilisable qu'une seule fois</p>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="mb-6 md:hidden">
            <button
              onClick={() => navigate("/connexion")}
              className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition"
            >
              ← Retour à la connexion
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Nouveau mot de passe
            </h2>
            <p className="text-sm text-slate-600">
              Choisissez un mot de passe d'au moins 8 caractères.
            </p>
          </div>

          {!token ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-4 text-sm text-rose-700">
              <p className="font-medium">Lien invalide</p>
              <p className="mt-1">Ce lien est invalide ou a expiré.</p>
              <button
                onClick={() => navigate("/mot-de-passe-oublie")}
                className="mt-2 text-xs underline underline-offset-2"
              >
                Refaire une demande
              </button>
            </div>
          ) : success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-sm text-emerald-700 space-y-2">
              <p className="font-medium">Mot de passe mis à jour !</p>
              <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button
                onClick={() => navigate("/connexion")}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                  >
                    Nouveau mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="passwordConfirm"
                    className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                  >
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                    placeholder="Répétez le mot de passe"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Mise à jour..." : "Enregistrer le mot de passe"}</span>
                  {!loading && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] text-black">
                      →
                    </span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
