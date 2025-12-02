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
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <p className="animate-pulse text-sm text-slate-500">
            Chargement du soin…
          </p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-semibold">Oups…</h1>
          <p className="text-slate-700">{error ?? "Soin introuvable."}</p>
        </div>
      </div>
    );
  }

  const mainPrice = formatPrice(service.priceCents);

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigate("/")}
            className="transition hover:text-slate-900"
          >
            Accueil
          </button>
          <span>›</span>
          {service.category && (
            <>
              <span className="uppercase tracking-[0.18em] text-slate-500">
                {service.category.name}
              </span>
              <span>›</span>
            </>
          )}
          <span className="text-slate-700">{service.name}</span>
        </div>

        {/* Grille principale : image à gauche, texte à droite */}
        <div className="grid gap-10 md:grid-cols-2 items-start">
          {/* Visuel principal */}
          <div className="space-y-4 order-1 md:order-1">
            <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full aspect-[4/3] md:aspect-[5/3] object-cover object-center"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-xs text-slate-500">
                  Visuel à venir
                </div>
              )}
            </div>

            {/* Miniatures placeholder (facultatif, tu pourras brancher d’autres images plus tard) */}
            {service.imageUrl && (
              <div className="flex gap-3">
                <button className="h-20 w-20 overflow-hidden rounded-xl border border-slate-300 bg-white">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="h-20 w-20 rounded-xl bg-slate-100" />
                <div className="h-20 w-20 rounded-xl bg-slate-100" />
                <div className="h-20 w-20 rounded-xl bg-slate-100" />
              </div>
            )}
          </div>

          {/* Texte principal + infos */}
          <div className="space-y-6 order-2 md:order-2">
            <p className="text-xs inline-flex items-center rounded-full bg-black text-white px-4 py-1 tracking-[0.18em] uppercase">
              Consultation informative
            </p>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              {service.name}
            </h1>

            {service.shortDescription && (
              <p className="text-sm md:text-base text-slate-800">
                {service.shortDescription}
              </p>
            )}

            {service.description && (
              <p className="text-sm leading-relaxed text-slate-700">
                {service.description}
              </p>
            )}

            {/* Prix + durée */}
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-baseline gap-2 text-slate-700">
                <span>À partir de</span>
                {mainPrice && (
                  <span className="text-xl font-semibold tracking-wide">
                    {mainPrice}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {service.durationMinutes && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {service.durationMinutes} min
                  </span>
                )}
                {mainPrice && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    {mainPrice}
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900"
              onClick={() => navigate(`/reservation/${service.slug}`)} // 👈 redirection
            >
              <span>Prendre RDV</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-black">
                →
              </span>
            </button>

            {/* Options / versions du soin */}
            {service.options && service.options.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Versions du soin
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {service.options.map((opt) => (
                    <li
                      key={opt.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{opt.name}</p>
                        {opt.duration && (
                          <p className="text-xs text-slate-500">
                            {opt.duration} min
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
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
