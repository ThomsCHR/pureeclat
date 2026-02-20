import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiCreateAppointment,
  apiGetAvailability,
  apiGetServiceBySlug,
} from "../api/apiClient";
import type { PractitionerAvailabilityApi } from "../api/apiClient";

type AvailabilitySlot = PractitionerAvailabilityApi["slots"][number];

type PractitionerAvailability = PractitionerAvailabilityApi;

type ServiceLight = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number | null;
};

const getPractitionerSubtitle = (name: string) => {
  if (name.startsWith("Cassandra")) {
    return "Directrice & fondatrice Pure Éclat";
  }
  if (name.startsWith("Camille")) {
    return "Responsable";
  }

  return "Esthéticienne Pure Éclat";
};

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState<ServiceLight | null>(null);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const isTodaySelected = date === todayStr;

  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<PractitionerAvailability[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // 🔐 si pas connecté → on envoie vers la connexion
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/connexion");
    }
  }, [isAuthenticated, navigate]);

  // Charger le service (id + nom) à partir du slug
  useEffect(() => {
    if (!slug) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetServiceBySlug(slug);

        setService({
          id: data.id,
          name: data.name,
          slug: data.slug,
          durationMinutes: data.durationMinutes ?? null,
        });
      } catch (err) {
        console.error(err);
        setError("Impossible de charger ce soin.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  // Charger les créneaux disponibles pour une date donnée
  useEffect(() => {
    if (!service) return;

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetAvailability(service.id, date);
        const practitioners = data.practitioners ?? [];

        // 🕒 Si on est sur la date du jour, vérifier s'il reste au moins un créneau futur
        if (date === todayStr) {
          const now = new Date();

          const hasFutureSlot = practitioners.some((p) =>
            p.slots.some((slot) => new Date(slot.start) > now)
          );

          // S'il n'y a plus aucun créneau futur aujourd'hui → passer automatiquement au lendemain
          if (!hasFutureSlot) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDate(tomorrow.toISOString().slice(0, 10));
            return; // on ne set pas l'availability pour aujourd'hui
          }
        }

        setAvailability(practitioners);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les disponibilités pour cette date.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [service, date, todayStr]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleCreateAppointment = async (
    practitionerId: number,
    slot: AvailabilitySlot
  ) => {
    if (!service) return;

    try {
      setCreating(true);

      await apiCreateAppointment({
        serviceId: service.id,
        practitionerId,
        startAt: slot.start,
      });

      navigate("/profil");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Impossible de réserver ce créneau pour le moment.");
    } finally {
      setCreating(false);
    }
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-xs text-slate-600 underline underline-offset-4 hover:text-slate-900"
        >
          ← Retour au soin
        </button>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-6">
          <div className="space-y-1">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
              prise de rendez-vous
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold">
              {service ? service.name : "Chargement du soin..."}
            </h1>
            <p className="text-sm text-slate-600">
              Choisissez une date et un créneau parmi les esthéticiennes
              disponibles.
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="date"
              className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-600"
            >
              Date souhaitée
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayStr} // ⬅️ pas de date passée
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-slate-500">Chargement des créneaux…</p>
        )}

        {!loading && !error && (
          <>
            {availability.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e4d4c5] bg-[#fff8f2] px-4 py-5 text-sm text-slate-600">
                Aucun créneau disponible pour cette date. Essayez une autre
                journée ou contactez-nous directement.
              </div>
            ) : (
              <div className="space-y-6">
                {availability.map((pract) => {
                  // On filtre les créneaux passés si la date sélectionnée est aujourd'hui
                  const visibleSlots = pract.slots.filter((slot) => {
                    if (!isTodaySelected) return true;
                    const startDate = new Date(slot.start);
                    return startDate > now;
                  });

                  if (visibleSlots.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={pract.practitionerId}
                      className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {pract.practitionerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getPractitionerSubtitle(pract.practitionerName)}
                          </p>
                        </div>
                        {service?.durationMinutes && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] text-slate-700">
                            Durée estimée : {service.durationMinutes} min
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {visibleSlots.map((slot) => (
                          <button
                            key={slot.start}
                            disabled={creating}
                            onClick={() =>
                              handleCreateAppointment(
                                pract.practitionerId,
                                slot
                              )
                            }
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {formatTime(slot.start)} – {formatTime(slot.end)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
