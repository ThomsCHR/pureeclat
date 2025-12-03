import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetMyAppointments,
  apiGetMyPractitionerAppointments,
  apiCancelAppointment,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

type AppointmentStatus = "upcoming" | "past" | "cancelled";

type ClientAppointment = {
  id: number;
  date: string;
  treatment: string;
  practitioner?: string;
  location?: string;
  status: AppointmentStatus;
};

type PractitionerAppointment = {
  id: number;
  date: string;
  treatment: string;
  clientName: string;
  status: AppointmentStatus;
};

type UserRole = "CLIENT" | "ADMIN" | "ESTHETICIENNE";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // rôle dérivé de l'utilisateur du contexte
  const role: UserRole | null = (user?.role as UserRole) ?? null;

  const [clientAppointments, setClientAppointments] = useState<
    ClientAppointment[]
  >([]);
  const [practitionerAppointments, setPractitionerAppointments] = useState<
    PractitionerAppointment[]
  >([]);

  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingPract, setLoadingPract] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // vue du profil : en tant que cliente ou praticienne
  const [profileMode, setProfileMode] = useState<"client" | "practitioner">(
    "client"
  );

  // Récupérer RDV client
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/connexion");
      return;
    }

    const fetchClientAppointments = async () => {
      try {
        setLoadingClient(true);
        setError(null);

        const data = await apiGetMyAppointments();
        setClientAppointments(data.appointments ?? []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger vos rendez-vous pour le moment.");
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClientAppointments();
  }, [isAuthenticated, navigate]);

  // Récupérer les RDV clients si esthéticienne
  useEffect(() => {
    if (!isAuthenticated || role !== "ESTHETICIENNE") return;

    const fetchPractitionerAppointments = async () => {
      try {
        setLoadingPract(true);
        const data = await apiGetMyPractitionerAppointments();
        setPractitionerAppointments(data.appointments ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPract(false);
      }
    };

    fetchPractitionerAppointments();
  }, [isAuthenticated, role]);

  const handleLogout = () => {
    logout();          // ← on passe par le contexte
    navigate("/");
  };

  // 👉 annulation d'un rendez-vous côté client
  const handleCancelAppointment = async (id: number) => {
    if (!isAuthenticated) {
      navigate("/connexion");
      return;
    }

    const confirmCancel = window.confirm(
      "Voulez-vous vraiment annuler ce rendez-vous ?"
    );
    if (!confirmCancel) return;

    try {
      await apiCancelAppointment(id);

      setClientAppointments((prev) =>
        prev.map((rdv) =>
          rdv.id === id ? { ...rdv, status: "cancelled" } : rdv
        )
      );
    } catch (err) {
      console.error(err);
      alert("Impossible d'annuler ce rendez-vous pour le moment.");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const filteredClientAppointments = clientAppointments.filter((rdv) =>
    activeTab === "upcoming"
      ? rdv.status === "upcoming"
      : rdv.status !== "upcoming"
  );

  const filteredPractAppointments = practitionerAppointments.filter(
    (rdv) => rdv.status === "upcoming"
  );

  return (
    <div className="min-h-screen bg-[#FFF5ED] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid gap-8 md:grid-cols-[1.1fr,1.6fr] items-stretch rounded-3xl bg-white/80 shadow-xl border border-[#f0dfd0] overflow-hidden">
        {/* Colonne gauche */}
        <div className="relative bg-gradient-to-br from-black via-[#1a1412] to-black text-white p-8 flex flex-col justify-between">
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
                espace personnel
              </p>
              <h1 className="text-3xl font-semibold">Pure Éclat</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Gérez vos rendez-vous, retrouvez l&apos;historique de vos soins
                et vos recommandations personnalisées.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-rose-100/80">
                Votre profil
              </p>
              <p className="font-medium">
                {user?.firstName || user?.lastName
                  ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                  : "Client Pure Éclat"}
              </p>
              <p className="text-xs text-white/70">{user?.email}</p>
              {user && (
                <p className="text-[0.7rem] text-white/60 mt-1">
                  Statut :{" "}
                  {user.isAdmin
                    ? role === "ESTHETICIENNE"
                      ? "Administratrice & Esthéticienne"
                      : "Administratrice"
                    : role === "ESTHETICIENNE"
                    ? "Esthéticienne"
                    : "Client(e)"}
                </p>
              )}
            </div>
          </div>

          <div className="relative mt-8 space-y-3 text-xs text-white/70">
            <p>• Visualisez vos prochains rendez-vous</p>
            {role === "ESTHETICIENNE" && (
              <p>• Consultez le planning de vos clientes</p>
            )}
            <p>• Annulez un créneau si nécessaire*</p>
            <p className="text-[0.65rem] text-white/50">
              *Selon nos conditions d&apos;annulation.
            </p>

            <button
              onClick={handleLogout}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="p-6 md:p-8 flex flex-col">
          <div className="mb-4 space-y-1">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              {role === "ESTHETICIENNE" && profileMode === "practitioner"
                ? "Vos rendez-vous clients"
                : "Vos rendez-vous"}
            </h2>
            <p className="text-sm text-slate-600">
              {role === "ESTHETICIENNE" && profileMode === "practitioner"
                ? "Planning des prochains soins prévus avec vos clientes."
                : "Retrouvez ici l'ensemble de vos soins à venir et passés."}
            </p>
          </div>

          {/* Si esthéticienne : switch entre vue cliente / vue praticienne */}
          {role === "ESTHETICIENNE" && (
            <div className="inline-flex items-center rounded-full bg-[#f5e7db] p-1 text-xs mb-4">
              <button
                onClick={() => setProfileMode("client")}
                className={`flex-1 px-4 py-2 rounded-full transition ${
                  profileMode === "client"
                    ? "bg-white shadow-sm text-slate-900 font-medium"
                    : "text-slate-600"
                }`}
              >
                Mes RDV en tant que cliente
              </button>
              <button
                onClick={() => setProfileMode("practitioner")}
                className={`flex-1 px-4 py-2 rounded-full transition ${
                  profileMode === "practitioner"
                    ? "bg-white shadow-sm text-slate-900 font-medium"
                    : "text-slate-600"
                }`}
              >
                Mes RDV clients
              </button>
            </div>
          )}

          {/* Tabs client (à venir / historique) */}
          {profileMode === "client" && (
            <div className="inline-flex items-center rounded-full bg-[#f5e7db] p-1 text-xs mb-6">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`flex-1 px-4 py-2 rounded-full transition ${
                  activeTab === "upcoming"
                    ? "bg-white shadow-sm text-slate-900 font-medium"
                    : "text-slate-600"
                }`}
              >
                Prochains rendez-vous
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`flex-1 px-4 py-2 rounded-full transition ${
                  activeTab === "past"
                    ? "bg-white shadow-sm text-slate-900 font-medium"
                    : "text-slate-600"
                }`}
              >
                Historique & annulés
              </button>
            </div>
          )}

          {error && profileMode === "client" && (
            <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Liste principale selon le mode */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {profileMode === "client" ? (
              // ---- Vue cliente ----
              loadingClient ? (
                <div className="text-sm text-slate-500">
                  Chargement de vos rendez-vous…
                </div>
              ) : filteredClientAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e4d4c5] bg-[#fff8f2] px-4 py-5 text-sm text-slate-600">
                  {activeTab === "upcoming" ? (
                    <p>
                      Vous n&apos;avez pas encore de rendez-vous à venir.{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="underline underline-offset-2 font-medium text-slate-900"
                      >
                        Prendre un rendez-vous
                      </button>
                    </p>
                  ) : (
                    <p>
                      Vous n&apos;avez pas encore d&apos;historique de soins.
                    </p>
                  )}
                </div>
              ) : (
                filteredClientAppointments.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="rounded-2xl border border-[#e4d4c5] bg-white/80 px-4 py-3 flex items-start justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#FFF5ED] border border-[#f0dfd0] px-2 py-1 text-xs font-medium text-slate-900 min-w-[64px]">
                        <span>{formatDate(rdv.date)}</span>
                        <span className="text-[0.7rem] text-slate-500">
                          {formatTime(rdv.date)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {rdv.treatment}
                        </p>
                        {rdv.practitioner && (
                          <p className="text-xs text-slate-600">
                            Avec {rdv.practitioner}
                          </p>
                        )}
                        {rdv.location && (
                          <p className="text-[0.7rem] text-slate-500">
                            {rdv.location}
                          </p>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                            rdv.status === "upcoming"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : rdv.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-50 text-slate-600 border border-slate-100"
                          }`}
                        >
                          {rdv.status === "upcoming"
                            ? "À venir"
                            : rdv.status === "cancelled"
                            ? "Annulé"
                            : "Terminé"}
                        </span>

                        {rdv.status === "upcoming" && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(rdv.id)}
                            className="mt-2 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.7rem] font-medium text-rose-700 hover:bg-rose-100 transition"
                          >
                            Annuler ce rendez-vous
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // ---- Vue praticienne ----
              <>
                {loadingPract ? (
                  <div className="text-sm text-slate-500">
                    Chargement de vos rendez-vous clients…
                  </div>
                ) : filteredPractAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e4d4c5] bg-[#fff8f2] px-4 py-5 text-sm text-slate-600">
                    Aucun rendez-vous client à venir pour le moment.
                  </div>
                ) : (
                  filteredPractAppointments.map((rdv) => (
                    <div
                      key={rdv.id}
                      className="rounded-2xl border border-[#e4d4c5] bg-white/80 px-4 py-3 flex items-start justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#FFF5ED] border border-[#f0dfd0] px-2 py-1 text-xs font-medium text-slate-900 min-w-[64px]">
                          <span>{formatDate(rdv.date)}</span>
                          <span className="text-[0.7rem] text-slate-500">
                            {formatTime(rdv.date)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-900">
                            {rdv.treatment}
                          </p>
                          <p className="text-xs text-slate-600">
                            Client(e) : {rdv.clientName}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                              rdv.status === "upcoming"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : rdv.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                            }`}
                          >
                            {rdv.status === "upcoming"
                              ? "À venir"
                              : rdv.status === "cancelled"
                              ? "Annulé"
                              : "Terminé"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
