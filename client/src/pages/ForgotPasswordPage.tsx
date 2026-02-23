import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiForgotPassword } from "../api/apiClient";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await apiForgotPassword(email);
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
                mot de passe oublié
              </p>
              <h1 className="text-3xl font-semibold">Pure Éclat</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Renseignez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>
          </div>
          <div className="relative space-y-3 text-xs text-white/60">
            <p>• Lien valable 1 heure</p>
            <p>• Vérifiez vos spams si vous ne recevez rien</p>
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
              Réinitialiser le mot de passe
            </h2>
            <p className="text-sm text-slate-600">
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-sm text-emerald-700 space-y-2">
              <p className="font-medium">Email envoyé !</p>
              <p>Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation sous peu. Pensez à vérifier vos spams.</p>
              <button
                onClick={() => navigate("/connexion")}
                className="mt-2 text-xs underline underline-offset-2 text-emerald-800 hover:text-emerald-900"
              >
                Retour à la connexion
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
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Envoi en cours..." : "Envoyer le lien"}</span>
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
