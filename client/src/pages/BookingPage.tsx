import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type AvailabilitySlot = {
  start: string; // ISO
  end: string; // ISO
};

type PractitionerAvailability = {
  practitionerId: number;
  practitionerName: string;
  slots: AvailabilitySlot[];
};

type ServiceLight = {
  id: number;
  name: string;
  slug: string;
  durationMinutes?: number | null;
};

const getPractitionerSubtitle = (name: string) => {
  if (name.startsWith("Cassandra")) {
    return "Directrice & fondatrice Pure Éclat";
  }
  if (name.startsWith("Camille")) {
    return "Responsable"; }

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

        const res = await fetch(`http://localhost:3000/api/services/${slug}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message ?? "Soin introuvable.");
        }

        setService({
          id: data.id,
          name: data.name,
          slug: data.slug,
          durationMinutes: data.durationMinutes,
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

        const res = await fetch(
          `http://localhost:3000/api/availability?serviceId=${service.id}&date=${date}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ?? "Impossible de charger les disponibilités."
          );
        }

        setAvailability(data.practitioners ?? []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les disponibilités pour cette date.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [service, date]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleCreateAppointment = async (
    practitionerId: number,
    slot: AvailabilitySlot
  ) => {
    const token = localStorage.getItem("authToken");
    if (!token || !service) return;

    try {
      setCreating(true);

      const res = await fetch("http://localhost:3000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          practitionerId,
          startAt: slot.start,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message ?? "Impossible de créer le rendez-vous.");
      }

      // ✅ tout OK → redirection vers le profil
      navigate("/profil");
    } catch (err) {
      console.error(err);
      alert("Impossible de réserver ce créneau pour le moment.");
    } finally {
      setCreating(false);
    }
  };

  if (!slug) return null;

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
                {availability.map((pract) => (
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
                      {pract.slots.map((slot) => (
                        <button
                          key={slot.start}
                          disabled={creating}
                          onClick={() =>
                            handleCreateAppointment(pract.practitionerId, slot)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {formatTime(slot.start)} – {formatTime(slot.end)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
