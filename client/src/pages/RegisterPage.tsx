import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRegister } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiRegister({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password,
      });

      if (!data.user) {
        throw new Error("Réponse invalide du serveur : utilisateur manquant.");
      }

      // ✅ on laisse le contexte gérer token + user + localStorage
      login(data.token, data.user);
      
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer votre compte pour le moment."
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
                créer mon espace
              </p>
              <h1 className="text-3xl font-semibold">Rejoindre Pure Éclat</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Créez votre espace personnel pour suivre vos rendez-vous,
                conserver vos rituels favoris et accéder aux offres privilégiées
                de l&apos;institut.
              </p>
            </div>
          </div>

          <div className="relative space-y-3 text-xs text-white/60">
            <p>• Historique de vos soins & recommandations</p>
            <p>• Gestion simple de vos rendez-vous</p>
            <p>• Accès anticipé aux nouveautés et événements</p>
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
              Créer mon compte
            </h2>
            <p className="text-sm text-slate-600">
              Quelques informations suffisent pour personnaliser vos expériences
              Pure Éclat.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom + Prénom */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="firstName"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                  placeholder="Camille"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="lastName"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                  placeholder="Dupont"
                />
              </div>
            </div>

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

            {/* Téléphone */}
            <div className="space-y-1">
              <label
                htmlFor="phone"
                className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
              >
                Téléphone (optionnel)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                  placeholder="********"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="passwordConfirm"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700"
                >
                  Confirmer
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[#e4d4c5] bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400"
                  placeholder="********"
                />
              </div>
            </div>

            {/* CGU */}
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <input
                id="cgu"
                type="checkbox"
                required
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-black focus:ring-black"
              />
              <label htmlFor="cgu">
                J&apos;accepte les{" "}
                <button
                  type="button"
                  className="underline underline-offset-2 text-slate-800 hover:text-black"
                >
                  conditions générales
                </button>{" "}
                et la politique de confidentialité de l&apos;institut.
              </label>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loading ? "Création du compte..." : "Créer mon compte"}
              </span>
              {!loading && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] text-black">
                  →
                </span>
              )}
            </button>
          </form>

          {/* Bas de carte */}
          <div className="mt-6 text-xs text-slate-500">
            <p>
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => navigate("/connexion")}
                className="font-medium text-slate-800 underline underline-offset-2 hover:text-black"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
