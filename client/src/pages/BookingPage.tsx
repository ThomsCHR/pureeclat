import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  apiCreateAppointment,
  apiCreatePaymentIntent,
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
  priceCents: number | null;
};

type PendingBooking = {
  practitionerId: number;
  slot: AvailabilitySlot;
  clientSecret: string;
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const INSTITUTES = [
  { id: "paris16",   label: "Paris 16",   address: "12 av. des Lumières, 75016" },
  { id: "lyon",      label: "Lyon",       address: "8 quai des Soins, 69002" },
  { id: "marseille", label: "Marseille",  address: "21 rue des Calanques, 13007" },
];

const getPractitionerSubtitle = (name: string) => {
  if (name.startsWith("Cassandra")) return "Directrice & fondatrice Pure Éclat";
  if (name.startsWith("Camille"))   return "Responsable — Institut Lyon";
  if (name.startsWith("Marine"))    return "Responsable — Institut Marseille";
  return "Esthéticienne Pure Éclat";
};

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const cardElementStyle = {
  style: {
    base: {
      fontSize: "14px",
      color: "#0f172a",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#e11d48" },
  },
};

type PaymentFormProps = {
  service: ServiceLight;
  pendingBooking: PendingBooking;
  onSuccess: () => void;
  onCancel: () => void;
  formatTime: (iso: string) => string;
};

function PaymentForm({ service, pendingBooking, onSuccess, onCancel, formatTime }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    try {
      setProcessing(true);
      setError(null);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        pendingBooking.clientSecret,
        {
          payment_method: {
            card: cardNumber,
            billing_details: { name: cardName },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message ?? "Erreur de paiement.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await apiCreateAppointment({
          serviceId: service.id,
          practitionerId: pendingBooking.practitionerId,
          startAt: pendingBooking.slot.start,
          stripePaymentIntentId: paymentIntent.id,
        });
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de finaliser le paiement.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Paiement sécurisé</p>
          <p className="text-lg font-semibold">{service.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-white/70">
              {formatTime(pendingBooking.slot.start)} – {formatTime(pendingBooking.slot.end)}
            </p>
            {service.priceCents && (
              <p className="text-xl font-bold">{formatPrice(service.priceCents)}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de carte</label>
            <div className="rounded-xl border border-slate-300 px-4 py-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
              <CardNumberElement options={cardElementStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiration</label>
              <div className="rounded-xl border border-slate-300 px-4 py-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                <CardExpiryElement options={cardElementStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CVV</label>
              <div className="rounded-xl border border-slate-300 px-4 py-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                <CardCvcElement options={cardElementStyle} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom sur la carte</label>
            <input
              type="text"
              placeholder="MARIE DUPONT"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black uppercase"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="flex-1 rounded-full border border-slate-300 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !stripe}
              className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {processing
                ? "Traitement…"
                : service.priceCents
                ? `Payer ${formatPrice(service.priceCents)}`
                : "Confirmer et payer"}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Mode test — utilisez la carte <span className="font-mono">4242 4242 4242 4242</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const institute = searchParams.get("institute") ?? undefined;
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState<ServiceLight | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const todayStr = new Date().toISOString().slice(0, 10);
  const isTodaySelected = date === todayStr;

  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<PractitionerAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openingPayment, setOpeningPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/connexion");
  }, [isAuthenticated, navigate]);

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
          priceCents: data.priceCents ?? null,
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

  useEffect(() => {
    if (!service || !institute) return;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGetAvailability(service.id, date, institute);
        const practitioners = data.practitioners ?? [];

        if (date === todayStr) {
          const now = new Date();
          const hasFutureSlot = practitioners.some((p) =>
            p.slots.some((slot) => new Date(slot.start) > now)
          );
          if (!hasFutureSlot) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDate(tomorrow.toISOString().slice(0, 10));
            return;
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
  }, [service, date, todayStr, institute]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const openPayment = async (practitionerId: number, slot: AvailabilitySlot) => {
    if (!service) return;

    if (!service.priceCents) {
      try {
        setOpeningPayment(true);
        await apiCreateAppointment({
          serviceId: service.id,
          practitionerId,
          startAt: slot.start,
        });
        navigate("/profil");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de réserver ce créneau.");
      } finally {
        setOpeningPayment(false);
      }
      return;
    }

    try {
      setOpeningPayment(true);
      setError(null);
      const { clientSecret } = await apiCreatePaymentIntent(service.id);
      setPendingBooking({ practitionerId, slot, clientSecret });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'initialiser le paiement.");
    } finally {
      setOpeningPayment(false);
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
              Choisissez un institut, une date et un créneau.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="date" className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-600">
              Date souhaitée
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayStr}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {!institute ? (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-900">Choisissez votre institut</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {INSTITUTES.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSearchParams({ institute: inst.id })}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-900 hover:shadow-md transition-all"
                >
                  <p className="text-sm font-semibold text-slate-900">{inst.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{inst.address}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white">
              📍 Institut {INSTITUTES.find((i) => i.id === institute)?.label ?? institute}
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-slate-500 underline underline-offset-4 hover:text-slate-800"
            >
              Changer
            </button>
          </div>
        )}

        {institute && error && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {institute && loading && (
          <p className="text-sm text-slate-500">Chargement des créneaux…</p>
        )}

        {institute && !loading && !error && (
          <>
            {availability.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e4d4c5] bg-[#fff8f2] px-4 py-5 text-sm text-slate-600">
                Aucun créneau disponible pour cette date. Essayez une autre journée ou contactez-nous directement.
              </div>
            ) : (
              <div className="space-y-6">
                {availability.map((pract) => {
                  const visibleSlots = pract.slots.filter((slot) => {
                    if (!isTodaySelected) return true;
                    return new Date(slot.start) > now;
                  });

                  if (visibleSlots.length === 0) return null;

                  return (
                    <div key={pract.practitionerId} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{pract.practitionerName}</p>
                          <p className="text-xs text-slate-500">{getPractitionerSubtitle(pract.practitionerName)}</p>
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
                            disabled={openingPayment}
                            onClick={() => openPayment(pract.practitionerId, slot)}
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

      {pendingBooking && service && (
        <Elements stripe={stripePromise} options={{ clientSecret: pendingBooking.clientSecret }}>
          <PaymentForm
            service={service}
            pendingBooking={pendingBooking}
            formatTime={formatTime}
            onSuccess={() => navigate("/profil")}
            onCancel={() => setPendingBooking(null)}
          />
        </Elements>
      )}
    </div>
  );
}
