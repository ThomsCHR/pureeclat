import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type ServiceOption = {
  id: number;
  name: string;
  duration: number | null;
  priceCents: number;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Service = {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  priceCents?: number | null;
  category?: Category;
  options?: ServiceOption[];
};

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://localhost:3000/api/services/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Ce soin n’a pas été trouvé.");
          } else {
            setError("Une erreur est survenue, veuillez réessayer.");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setService(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger ce soin pour le moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  const formatPrice = (cents?: number | null) => {
    if (!cents && cents !== 0) return undefined;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950/95 pt-24 text-slate-50">
        <div className="mx-auto max-w-4xl px-4">
          <p className="animate-pulse text-sm text-slate-400">
            Chargement du soin…
          </p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-950/95 pt-24 text-slate-50">
        <div className="mx-auto max-w-4xl px-4 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-300 underline underline-offset-4 hover:text-white"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-semibold">Oups…</h1>
          <p className="text-slate-300">{error ?? "Soin introuvable."}</p>
        </div>
      </div>
    );
  }

  const mainPrice = formatPrice(service.priceCents);

  return (
    <div className="min-h-screen bg-[#f5e9d8] pt-24 text-slate-900">
      <section className="mx-auto max-w-5xl px-4 pb-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => navigate("/")}
            className="hover:text-white transition"
          >
            Accueil
          </button>
          <span>›</span>
          {service.category && (
            <>
              <span className="uppercase tracking-[0.18em] text-slate-400">
                {service.category.name}
              </span>
              <span>›</span>
            </>
          )}
          <span className="text-slate-200">{service.name}</span>
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Texte principal */}
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-rose-300/80">
              soin signature
            </p>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              {service.name}
            </h1>

            {service.shortDescription && (
              <p className="text-sm md:text-base text-slate-200/90">
                {service.shortDescription}
              </p>
            )}

            {service.description && (
              <p className="text-sm leading-relaxed text-slate-300">
                {service.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-slate-200">
              {service.durationMinutes && (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {service.durationMinutes} min
                </span>
              )}
              {mainPrice && (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {mainPrice}
                </span>
              )}
            </div>

            <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:bg-slate-100">
              <span>Prendre rendez-vous</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                →
              </span>
            </button>
          </div>

          {/* Visuel + options */}
          <div className="space-y-6">
            {/* Image */}
            <div className="overflow-hidden rounded-3xl bg-slate-900/60 ring-1 ring-slate-800/80">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-64 w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                  Visuel à venir
                </div>
              )}
            </div>

            {/* Variantes / options */}
            {service.options && service.options.length > 0 && (
              <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
                <h2 className="text-sm font-semibold text-slate-50">
                  Versions du soin
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {service.options.map((opt) => (
                    <li
                      key={opt.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 px-3 py-2"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-slate-100">
                          {opt.name}
                        </p>
                        {opt.duration && (
                          <p className="text-xs text-slate-400">
                            {opt.duration} min
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-50">
                        {formatPrice(opt.priceCents)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
