import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  apiGetPricingServices,
  type PricingServiceApi,
} from "../api/apiClient";

export default function ServicesListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const institute = searchParams.get("institute");

  const [services, setServices] = useState<PricingServiceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetPricingServices();

        // Tu as typé: PricingServiceApi[] | { services: PricingServiceApi[] }
        const normalized: PricingServiceApi[] = Array.isArray(data)
          ? data
          : data.services;

        setServices(normalized);
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          setError(
            err.message ||
              "Une erreur est survenue lors du chargement des soins."
          );
        } else {
          setError("Impossible de charger les soins pour le moment.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Regrouper par catégorie
  const servicesByCategory = services.reduce<
    Record<string, PricingServiceApi[]>
  >((acc, service) => {
    const catName = service.category?.name ?? "Autres soins";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(service);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <p className="animate-pulse text-sm text-slate-500">
            Chargement des soins…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-semibold">Aucun soin disponible</h1>
          <p className="text-slate-700">
            Les soins ne sont pas encore configurés. Revenez un peu plus tard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigate("/")}
            className="transition hover:text-slate-900"
          >
            Accueil
          </button>
          <span>›</span>
          <span className="uppercase tracking-[0.18em] text-slate-500">
            Tous les soins
          </span>
        </div>

        {/* Titre + intro */}
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Tous nos soins
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-700 max-w-xl">
              Explorez l’ensemble des soins proposés, classés par catégorie,
              avec leur durée et leur tarif. Cliquez sur un soin pour en
              découvrir le détail et prendre rendez-vous.
            </p>
          </div>
          <p className="text-xs inline-flex items-center rounded-full bg-black text-white px-4 py-1 tracking-[0.18em] uppercase">
            Prendre soin de vous
          </p>
        </div>

        {/* Liste des catégories + soins */}
        <div className="space-y-10">
          {Object.entries(servicesByCategory).map(
            ([categoryName, categoryServices]) => (
              <section key={categoryName} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                    {categoryName}
                  </h2>
                  {/* Badge nb de soins */}
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                    {categoryServices.length} soin
                    {categoryServices.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {categoryServices.map((service) => {
                      return (
                        <li
                          key={service.id}
                          className="group flex flex-col gap-2 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:gap-6 transition hover:bg-slate-50"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 group-hover:text-slate-950">
                              {service.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {service.category?.name}
                            </p>
                          </div>

                          <button
                            onClick={() => navigate(`/soins/${service.slug}${institute ? `?institute=${institute}` : ""}`)}
                            className="text-[11px] uppercase tracking-[0.16em] text-slate-400 group-hover:text-slate-700 hover:underline"
                          >
                            Voir le détail →
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )
          )}
        </div>
      </section>
    </div>
  );
}
