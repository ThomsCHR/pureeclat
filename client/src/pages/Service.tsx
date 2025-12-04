import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetServiceBySlug,
  apiUpdateService,
  type ServiceApi,
} from "../api/apiClient";

type EditFormState = {
  name: string;
  shortDescription: string;
  description: string;
  durationMinutes: string;
  priceEuros: string;
};

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [service, setService] = useState<ServiceApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // état édition admin
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Soin introuvable.");
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetServiceBySlug(slug);
        setService(data);

        // pré-remplir le formulaire si admin
        setForm({
          name: data.name ?? "",
          shortDescription: data.shortDescription ?? "",
          description: data.description ?? "",
          durationMinutes: data.durationMinutes
            ? String(data.durationMinutes)
            : "",
          priceEuros: data.priceCents ? String(data.priceCents / 100) : "",
        });
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          if (err.message.includes("404")) {
            setError("Ce soin n’a pas été trouvé.");
          } else {
            setError(
              err.message || "Une erreur est survenue, veuillez réessayer."
            );
          }
        } else {
          setError("Impossible de charger ce soin pour le moment.");
        }
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

  const handleChangeField = (field: keyof EditFormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !form) return;

    // parse durée
    let durationMinutes: number | null = null;
    if (form.durationMinutes.trim() !== "") {
      const parsed = Number(form.durationMinutes);
      if (Number.isNaN(parsed)) {
        alert("Durée invalide.");
        return;
      }
      durationMinutes = parsed;
    }

    // parse prix
    let priceCents: number | null = null;
    if (form.priceEuros.trim() !== "") {
      const euros = Number(form.priceEuros.replace(",", "."));
      if (Number.isNaN(euros)) {
        alert("Prix invalide.");
        return;
      }
      priceCents = Math.round(euros * 100);
    }

    try {
      setSaving(true);
      setError(null);

      const updated = await apiUpdateService(service.id, {
        name: form.name.trim() || service.name,
        shortDescription:
          form.shortDescription.trim() === ""
            ? null
            : form.shortDescription.trim(),
        description:
          form.description.trim() === "" ? null : form.description.trim(),
        durationMinutes,
        priceCents,
      });

      setService(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le soin."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!service) return;
    setForm({
      name: service.name ?? "",
      shortDescription: service.shortDescription ?? "",
      description: service.description ?? "",
      durationMinutes: service.durationMinutes
        ? String(service.durationMinutes)
        : "",
      priceEuros: service.priceCents ? String(service.priceCents / 100) : "",
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900 overflow-x-hidden">
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
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900 overflow-x-hidden">
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
    // 🧵 important : on coupe tout débordement horizontal
    <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900 overflow-x-hidden">
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {/* Breadcrumb */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
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
          <span className="text-slate-700 break-words">{service.name}</span>

          {isAdmin && (
            <span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap">
              Mode admin {saving && "• enregistrement..."}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Grille principale */}
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

          {/* Texte + infos */}
          <div className="space-y-6 order-2 md:order-2">
            <p className="text-xs inline-flex items-center rounded-full bg-black text-white px-4 py-1 tracking-[0.18em] uppercase">
              Consultation informative
            </p>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
                {service.name}
              </h1>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="text-xs rounded-full border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                >
                  {isEditing ? "Fermer l'édition" : "Modifier le soin"}
                </button>
              )}
            </div>

            {service.shortDescription && (
              <p className="text-sm md:text-base text-slate-800">
                {service.shortDescription}
              </p>
            )}

            {service.description && (
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line break-words">
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
              onClick={() => navigate(`/reservation/${service.slug}`)}
            >
              <span>Prendre RDV</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-black">
                →
              </span>
            </button>

            {/* Bloc options */}
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
                        <p className="font-medium text-slate-900">
                          {opt.name}
                        </p>
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

        {/* 🛠 Panneau d'édition admin */}
        {isAdmin && isEditing && form && (
          <div className="mt-10 w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Modifier les informations du soin
            </h2>

            <form className="space-y-4" onSubmit={handleSubmitEdit}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nom du soin
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChangeField("name", e.target.value)}
                  className="w-full max-w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description courte
                </label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) =>
                    handleChangeField("shortDescription", e.target.value)
                  }
                  className="w-full max-w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description détaillée
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    handleChangeField("description", e.target.value)
                  }
                  rows={4}
                  className="w-full max-w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      handleChangeField("durationMinutes", e.target.value)
                    }
                    className="w-full max-w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Prix (en euros)
                  </label>
                  <input
                    type="text"
                    value={form.priceEuros}
                    onChange={(e) =>
                      handleChangeField("priceEuros", e.target.value)
                    }
                    className="w-full max-w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                >
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
