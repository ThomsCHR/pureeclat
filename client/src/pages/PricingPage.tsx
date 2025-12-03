import { useEffect, useState } from "react";

type Service = {
  id: number;
  name: string;
  slug: string;
  priceCents: number | null;
  durationMinutes: number | null;
  category: {
    name: string;
    slug: string;
  };
};

type GroupedServices = {
  [categoryName: string]: Service[];
};

const formatPrice = (priceCents: number | null | undefined) => {
  if (priceCents == null) return "Sur devis";
  // ex: 12000 -> "120 €"
  return `${(priceCents / 100).toFixed(0)} €`;
};

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return "-";
  return `${minutes} min`;
};

// Fallback statique (au cas où l'API n'est pas prête / en erreur)
const STATIC_SERVICES: Service[] = [
  // --- RITUELS VISAGE ---
  {
    id: 1,
    name: "Rituel Éclat Signature",
    slug: "rituel-eclat-signature",
    priceCents: 12000,
    durationMinutes: 75,
    category: { name: "Rituels visage", slug: "rituels-visage" },
  },
  {
    id: 2,
    name: "Hydra Glow",
    slug: "hydra-glow",
    priceCents: 9500,
    durationMinutes: 60,
    category: { name: "Rituels visage", slug: "rituels-visage" },
  },
  {
    id: 3,
    name: "Peeling doux rénovateur",
    slug: "peeling-doux-renovateur",
    priceCents: 8500,
    durationMinutes: 45,
    category: { name: "Rituels visage", slug: "rituels-visage" },
  },
  {
    id: 4,
    name: "Massage sculptant visage",
    slug: "massage-sculptant",
    priceCents: 9000,
    durationMinutes: 50,
    category: { name: "Rituels visage", slug: "rituels-visage" },
  },

  // --- SOINS CORPS ---
  {
    id: 5,
    name: "Modelage relaxant",
    slug: "modelage-relaxant",
    priceCents: 9000,
    durationMinutes: 60,
    category: { name: "Soins corps", slug: "soins-corps" },
  },
  {
    id: 6,
    name: "Enveloppement raffermissant",
    slug: "enveloppement-raffermissant",
    priceCents: 9500,
    durationMinutes: 60,
    category: { name: "Soins corps", slug: "soins-corps" },
  },
  {
    id: 7,
    name: "Drainage esthétique",
    slug: "drainage-esthetique",
    priceCents: 9800,
    durationMinutes: 60,
    category: { name: "Soins corps", slug: "soins-corps" },
  },
  {
    id: 8,
    name: "Soin jambes légères",
    slug: "soin-jambes-legeres",
    priceCents: 7500,
    durationMinutes: 40,
    category: { name: "Soins corps", slug: "soins-corps" },
  },

  // --- BEAUTÉ DU REGARD ---
  {
    id: 9,
    name: "Brow Lift & structuration",
    slug: "brow-lift",
    priceCents: 6500,
    durationMinutes: 45,
    category: { name: "Beauté du regard", slug: "beaute-du-regard" },
  },
  {
    id: 10,
    name: "Rehaussement de cils",
    slug: "rehaussement-cils",
    priceCents: 7500,
    durationMinutes: 60,
    category: { name: "Beauté du regard", slug: "beaute-du-regard" },
  },
  {
    id: 11,
    name: "Teinture cils & sourcils",
    slug: "teinture-cils-sourcils",
    priceCents: 4500,
    durationMinutes: 30,
    category: { name: "Beauté du regard", slug: "beaute-du-regard" },
  },
  {
    id: 12,
    name: "Soin contour des yeux",
    slug: "soin-contour-yeux",
    priceCents: 6000,
    durationMinutes: 35,
    category: { name: "Beauté du regard", slug: "beaute-du-regard" },
  },
];

export default function PricingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:3000/api/services");
        if (!res.ok) throw new Error("Erreur lors du chargement des soins");

        const data = await res.json();

        // On suppose que l'API renvoie un tableau de services avec category incluse
        if (Array.isArray(data.services)) {
          setServices(data.services);
        } else if (Array.isArray(data)) {
          setServices(data);
        } else {
          // si la structure ne matche pas, on bascule sur le fallback
          setServices(STATIC_SERVICES);
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la carte des soins pour le moment.");
        setServices(STATIC_SERVICES); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const grouped: GroupedServices = services.reduce((acc, service) => {
    const catName = service.category?.name ?? "Autres soins";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(service);
    return acc;
  }, {} as GroupedServices);

  const categoryOrder = [
    "Rituels visage",
    "Soins corps",
    "Beauté du regard",
  ];

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

              return (
                <section key={categoryName} className="space-y-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                      {categoryName}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-600">
                      Des protocoles conçus pour sublimer votre beauté
                      naturelle en respectant votre peau et vos besoins.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#ead8c7] bg-white/90 shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#fdf4ec] text-xs uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">
                            Soin
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Durée
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Tarifs TTC
                          </th>
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
                              <p className="font-medium text-slate-900">
                                {service.name}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top text-slate-600">
                              {formatDuration(service.durationMinutes)}
                            </td>
                            <td className="px-4 py-3 align-top text-right font-semibold text-slate-900">
                              {formatPrice(service.priceCents)}
                            </td>
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
