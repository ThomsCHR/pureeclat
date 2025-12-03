// src/pages/AdminUserAppointmentsPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetUserAppointments,
  apiCancelAppointment,
  type AdminUserApi,
  type AdminClientAppointmentApi,
  type AdminPractitionerAppointmentApi,
} from "../api/apiClient";

type AppointmentStatus = "BOOKED" | "COMPLETED" | "CANCELLED";

type ClientAppointment = AdminClientAppointmentApi;
type PractitionerAppointment = AdminPractitionerAppointmentApi;
type UserInfo = AdminUserApi;

export default function AdminUserAppointmentsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [clientAppointments, setClientAppointments] = useState<ClientAppointment[]>([]);
  const [practitionerAppointments, setPractitionerAppointments] = useState<PractitionerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        setError(null);

        const data = await apiGetUserAppointments(Number(id));

        setUser(data.user);
        setClientAppointments(data.clientAppointments ?? []);
        setPractitionerAppointments(data.practitionerAppointments ?? []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les rendez-vous de cet utilisateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAdmin, navigate]);

  // 🔥 Annulation par admin (utilise la même API que le client)
  const handleAdminCancel = async (appointmentId: number) => {
    const confirm = window.confirm("Voulez-vous annuler ce rendez-vous ?");
    if (!confirm) return;

    try {
      await apiCancelAppointment(appointmentId);

      // Mettre à jour les 2 listes
      setClientAppointments((prev) =>
        prev.map((r) =>
          r.id === appointmentId ? { ...r, status: "CANCELLED" } : r
        )
      );
      setPractitionerAppointments((prev) =>
        prev.map((r) =>
          r.id === appointmentId ? { ...r, status: "CANCELLED" } : r
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'annulation.");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isPastAppointment = (iso: string) => {
    return new Date(iso) < new Date();
  };

  const formatStatus = (status: AppointmentStatus, startAt: string) => {
    if (status === "BOOKED") {
      // Si le rendez-vous est passé mais toujours "BOOKED" en BDD
      if (isPastAppointment(startAt)) {
        return "Passé";
      }
      return "À venir";
    }

    switch (status) {
      case "COMPLETED":
        return "Terminé";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="p-8">Chargement des rendez-vous…</div>;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] px-4 py-20">
        <div className="mx-auto max-w-3xl bg-white/90 rounded-2xl border border-[#ead8c7] p-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 underline underline-offset-4 mb-4"
          >
            ← Retour
          </button>
          <p className="text-sm text-rose-700">
            {error ?? "Utilisateur introuvable."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5ED] px-4 py-20">
      <div className="mx-auto max-w-4xl bg-white/90 rounded-2xl border border-[#ead8c7] p-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 underline underline-offset-4"
        >
          ← Retour
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Rendez-vous de {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-slate-600">{user.email}</p>
          <p className="text-xs text-slate-500 mt-1">Rôle : {user.role}</p>
        </div>

        {/* RDV en tant que client(e) */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            RDV en tant que client(e)
          </h2>

          {clientAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun rendez-vous en tant que client(e).
            </p>
          ) : (
            <div className="space-y-2">
              {clientAppointments.map((rdv) => (
                <div
                  key={rdv.id}
                  className="rounded-2xl border border-[#e4d4c5] bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {rdv.serviceName}
                    </p>
                    <p className="text-xs text-slate-600">
                      Avec {rdv.practitionerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(rdv.startAt)} · {formatTime(rdv.startAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                      {formatStatus(rdv.status, rdv.startAt)}
                    </span>

                    {rdv.status === "BOOKED" && !isPastAppointment(rdv.startAt) && (
                      <button
                        onClick={() => handleAdminCancel(rdv.id)}
                        className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[0.7rem] text-rose-700 font-medium hover:bg-rose-200 transition"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RDV en tant que praticienne */}
        {practitionerAppointments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              RDV en tant que praticienne
            </h2>
            <div className="space-y-2">
              {practitionerAppointments.map((rdv) => (
                <div
                  key={rdv.id}
                  className="rounded-2xl border border-[#e4d4c5] bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {rdv.serviceName}
                    </p>
                    <p className="text-xs text-slate-600">
                      Client(e) : {rdv.clientName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(rdv.startAt)} · {formatTime(rdv.startAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                      {formatStatus(rdv.status, rdv.startAt)}
                    </span>

                    {rdv.status === "BOOKED" && !isPastAppointment(rdv.startAt) && (
                      <button
                        onClick={() => handleAdminCancel(rdv.id)}
                        className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[0.7rem] text-rose-700 font-medium hover:bg-rose-200 transition"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
