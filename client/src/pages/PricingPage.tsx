import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetPricingServices,
  apiDeleteService,
  type PricingServiceApi,
} from "../api/apiClient";

type GroupedServices = {
  [categoryName: string]: PricingServiceApi[];
};

const formatPrice = (priceCents: number | null | undefined) => {
  if (priceCents == null) return "Sur devis";
  return `${(priceCents / 100).toFixed(0)} €`;
};

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return "-";
  return `${minutes} min`;
};

// Fallback statique (si besoin)
const STATIC_SERVICES: PricingServiceApi[] = [
  // ...
];

export default function PricingPage() {
  const [services, setServices] = useState<PricingServiceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetPricingServices(); 
        // data : PricingServiceApi[] | { services: PricingServiceApi[] }

        if (Array.isArray(data)) {
          // cas 1 : l'API renvoie directement un tableau
          setServices(data);
        } else {
          // cas 2 : l'API renvoie { services: [...] }
          setServices(data.services);
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la carte des soins pour le moment.");
        setServices(STATIC_SERVICES);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDeleteService = async (id: number) => {
    const ok = window.confirm(
      "Supprimer ce soin et tous les rendez-vous associés ?"
    );
    if (!ok) return;

    try {
      setError(null);
      await apiDeleteService(id); // typé côté apiClient

      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer ce soin pour le moment."
      );
    }
  };

  const grouped: GroupedServices = services.reduce((acc, service) => {
    const catName = service.category?.name ?? "Autres soins";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(service);
    return acc;
  }, {} as GroupedServices);

  const categoryOrder = ["Rituels visage", "Soins corps", "Beauté du regard"];

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="min-h-screen bg-[#FFF5ED] px-4 py-24">
      <div className="mx-auto max-w-5xl">
        {/* En-tête */}
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            carte des soins
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-900">
            Soins & tarifs Pure Éclat
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-600">
            Une vue d&apos;ensemble de nos rituels visage, soins corps et
            prestations regard, pour vous aider à choisir le soin le plus adapté
            à vos besoins.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
        </header>

        {/* Loading */}
        {loading && (
          <p className="text-sm text-slate-500">Chargement de la carte…</p>
        )}

        {/* Liste des catégories */}
        {!loading && (
          <div className="space-y-10">
            {sortedCategories.map((categoryName) => {
              const items = grouped[categoryName];
              const categorySlug = items[0]?.category?.slug;

              return (
                <section key={categoryName} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                        {categoryName}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-600">
                        Des protocoles conçus pour sublimer votre beauté
                        naturelle en respectant votre peau et vos besoins.
                      </p>
                    </div>

                    {/* Bouton admin : ajouter un soin dans cette catégorie */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            categorySlug
                              ? `/services?category=${categorySlug}`
                              : "/services"
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[0.75rem] font-medium text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                          +
                        </span>
                        Ajouter un soin
                      </button>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#ead8c7] bg-white/90 shadow-sm">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-[#fdf4ec] text-xs uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="w-1/2 px-4 py-3 text-left font-medium">
                            Soin
                          </th>
                          <th className="w-28 px-4 py-3 text-left font-medium">
                            Durée
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Tarifs TTC
                          </th>
                          {isAdmin && (
                            <th className="w-28 px-4 py-3 text-right font-medium">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((service, index) => (
                          <tr
                            key={service.id ?? service.slug}
                            className={
                              index % 2 === 0 ? "bg-white/0" : "bg-[#fff7f0]"
                            }
                          >
                            <td className="px-4 py-3 align-top">
                              <button
                                onClick={() =>
                                  navigate(`/soins/${service.slug}`)
                                }
                                className="font-medium text-slate-900 hover:underline hover:text-slate-700 transition"
                              >
                                {service.name}
                              </button>
                            </td>
                            <td className="px-4 py-3 align-top text-slate-600">
                              {formatDuration(service.durationMinutes)}
                            </td>
                            <td className="px-4 py-3 align-top text-right font-semibold text-slate-900">
                              {formatPrice(service.priceCents)}
                            </td>

                            {isAdmin && (
                              <td className="px-4 py-3 align-top text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteService(service.id)
                                  }
                                  className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.7rem] font-medium text-rose-700 hover:bg-rose-100 transition"
                                >
                                  Supprimer
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Note bas de page */}
        <p className="mt-10 text-[0.7rem] text-slate-500">
          Les tarifs indiqués sont TTC. Certains protocoles peuvent être
          personnalisés en fonction de vos besoins lors de votre consultation à
          l&apos;institut.
        </p>
      </div>
    </div>
  );
}
