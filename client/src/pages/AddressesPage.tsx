import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

type Address = {
  id: string;
  city: string;
  title: string;
  subtitle: string;
  address: string;
  description: string;
  phone: string;
  email: string;
  openingHours: string[];
  imageUrl: string;
  mapUrl: string;
};

const ADDRESSES: Address[] = [
  {
    id: "paris16",
    city: "Paris 16",
    title: "Institut PureÉclat – Paris 16",
    subtitle: "Adresse fictive.",
    address: "12 avenue des Lumières, 75016 Paris",
    description:
      "Un écrin lumineux au cœur du 16ᵉ, pensé pour des soins visage et corps sur-mesure, dans une ambiance douce et feutrée.",
    phone: "+33 1 23 45 67 89",
    email: "paris16@pureeclat.fr",
    imageUrl: "/images/Paris.png",
    mapUrl: "https://www.openstreetmap.org/export/embed.html?bbox=2.264%2C48.8537%2C2.284%2C48.8737&layer=mapnik&marker=48.8637%2C2.274",
    openingHours: [
      "Lundi – Vendredi : 10h00 – 19h30",
      "Samedi : 10h00 – 18h00",
      "Dimanche : fermé",
    ],
  },
  {
    id: "lyon",
    city: "Lyon",
    title: "Institut PureÉclat – Lyon",
    subtitle: "Adresse fictive.",
    address: "8 quai des Soins, 69002 Lyon",
    description:
      "Une parenthèse de calme au bord de la Saône, pour un moment de détente profonde et de reconnexion à soi.",
    phone: "+33 4 56 78 90 12",
    email: "lyon@pureeclat.fr",
    imageUrl: "/images/Lyon.png",
    mapUrl: "https://www.openstreetmap.org/export/embed.html?bbox=4.8217%2C45.7436%2C4.8417%2C45.7636&layer=mapnik&marker=45.7536%2C4.8317",
    openingHours: [
      "Lundi – Vendredi : 9h30 – 19h00",
      "Samedi : 10h00 – 18h30",
      "Dimanche : fermé",
    ],
  },
  {
    id: "marseille",
    city: "Marseille",
    title: "Institut PureÉclat – Marseille",
    subtitle: "Adresse fictive.",
    address: "21 rue des Calanques, 13007 Marseille",
    description:
      "Une atmosphère chaleureuse, inspirée de la lumière méditerranéenne, pour des soins ressourçants toute l’année.",
    phone: "+33 4 91 23 45 67",
    email: "marseille@pureeclat.fr",
    imageUrl: "/images/Marseille.png",
    mapUrl: "https://www.openstreetmap.org/export/embed.html?bbox=5.3711%2C43.2865%2C5.3911%2C43.3065&layer=mapnik&marker=43.2965%2C5.3811",
    openingHours: [
      "Lundi – Vendredi : 10h00 – 19h00",
      "Samedi : 10h00 – 18h00",
      "Dimanche : fermé",
    ],
  },
];

export default function AddressesPage() {
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<Address | null>(() => {
    const city = searchParams.get("city");
    return ADDRESSES.find((a) => a.id === city) ?? ADDRESSES[0];
  });

  useEffect(() => {
    const city = searchParams.get("city");
    if (city) {
      const found = ADDRESSES.find((a) => a.id === city);
      if (found) setSelected(found);
    }
  }, [searchParams]);

  return (
    // on ajoute du padding-top pour dégager la navbar
    <div className="min-h-screen bg-[#F5F8FF] text-slate-900 pt-24">
      <main className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Des adresses au cœur de la ville
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              Des lieux chaleureux et lumineux, pensés pour que chaque visite
              soit un moment pour vous.
            </p>
          </div>

          <div className="ml-auto flex flex-col items-end gap-4">
          
          </div>
        </div>

        {/* Grille des cartes */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          {ADDRESSES.map((addr) => {
            const isActive = selected?.id === addr.id;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => setSelected(addr)}
                className={`text-left rounded-3xl border px-4 pb-4 pt-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md bg-white ${
                  isActive
                    ? "border-slate-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="mb-3 overflow-hidden rounded-2xl bg-slate-200">
                  <div className="mb-3 overflow-hidden rounded-2xl bg-slate-200">
                    <div className="relative">
                      <img
                        src={addr.imageUrl}
                        alt={addr.city}
                        className="aspect-[4/3] w-full object-cover"
                      />

                      {/* Badge sur l’image */}
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-900 shadow">
                        {addr.city}
                      </span>
                    </div>
                  </div>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {addr.city}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{addr.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Panneau de détails */}
        {selected && (
          <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            {/* Infos texte */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {selected.city}
              </p>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{selected.address}</p>

              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                {selected.description}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Horaires d&apos;ouverture
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {selected.openingHours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Contact
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>Tél : {selected.phone}</p>
                    <p>Email : {selected.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black">
                  Prendre rendez-vous
                </button>
                <button className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                  Voir le détail des soins
                </button>
              </div>
            </div>

            {/* Carte OpenStreetMap */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                Localisation (fictive)
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <iframe
                  key={selected.id}
                  src={selected.mapUrl}
                  width="100%"
                  height="300"
                  className="block"
                  loading="lazy"
                  title={`Carte ${selected.city}`}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
