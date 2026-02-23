import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetPricingServices,
  apiCreateService,
  apiGetCategories,
  apiUploadImage,
  type PricingServiceApi,
  type CategoryApi,
} from "../api/apiClient";

type CreateForm = {
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  durationMinutes: string;
  priceEuros: string;
  imageUrl: string;
};

const EMPTY_FORM: CreateForm = {
  name: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  durationMinutes: "",
  priceEuros: "",
  imageUrl: "",
};

export default function ServicesListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const institute = searchParams.get("institute");
  const { isAdmin } = useAuth();

  const [services, setServices] = useState<PricingServiceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Création d'un nouveau soin
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Gestion image : "file" ou "url"
  const [imageTab, setImageTab] = useState<"file" | "url">("file");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGetPricingServices();
        const normalized: PricingServiceApi[] = Array.isArray(data)
          ? data
          : data.services;
        setServices(normalized);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message || "Une erreur est survenue lors du chargement des soins.");
        } else {
          setError("Impossible de charger les soins pour le moment.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Charger les catégories quand l'admin ouvre la modale
  function openCreateModal() {
    setForm(EMPTY_FORM);
    setCreateError(null);
    setImageTab("file");
    setImageFile(null);
    setImagePreview(null);
    if (categories.length === 0) {
      apiGetCategories()
        .then((d) => setCategories(d.categories))
        .catch(() => {});
    }
    setShowModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) {
      setCreateError("Le nom et la catégorie sont obligatoires.");
      return;
    }

    let durationMinutes: number | null = null;
    if (form.durationMinutes.trim() !== "") {
      const d = Number(form.durationMinutes);
      if (Number.isNaN(d) || d <= 0) { setCreateError("Durée invalide."); return; }
      durationMinutes = d;
    }

    let priceCents: number | null = null;
    if (form.priceEuros.trim() !== "") {
      const euros = Number(form.priceEuros.replace(",", "."));
      if (Number.isNaN(euros) || euros < 0) { setCreateError("Prix invalide."); return; }
      priceCents = Math.round(euros * 100);
    }

    try {
      setCreating(true);
      setCreateError(null);

      // Upload du fichier si nécessaire
      let finalImageUrl: string | undefined = form.imageUrl.trim() || undefined;
      if (imageTab === "file" && imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await apiUploadImage(imageFile);
        } catch (err) {
          setCreateError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
          return;
        } finally {
          setUploading(false);
        }
      }

      const newService = await apiCreateService({
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
        durationMinutes,
        priceCents,
        imageUrl: finalImageUrl,
      });
      setShowModal(false);
      navigate(`/soins/${newService.slug}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  }

  // Regrouper par catégorie
  const servicesByCategory = services.reduce<Record<string, PricingServiceApi[]>>(
    (acc, service) => {
      const catName = service.category?.name ?? "Autres soins";
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(service);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <p className="animate-pulse text-sm text-slate-500">Chargement des soins…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 space-y-4">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900">
            ← Retour
          </button>
          <h1 className="text-2xl font-semibold">Oups…</h1>
          <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-24 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button onClick={() => navigate("/")} className="transition hover:text-slate-900">
            Accueil
          </button>
          <span>›</span>
          <span className="uppercase tracking-[0.18em] text-slate-500">Tous les soins</span>
        </div>

        {/* Titre + intro */}
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">Tous nos soins</h1>
            <p className="mt-2 text-sm md:text-base text-slate-700 max-w-xl">
              Explorez l'ensemble des soins proposés, classés par catégorie, avec leur durée et
              leur tarif. Cliquez sur un soin pour en découvrir le détail et prendre rendez-vous.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black transition-colors"
              >
                Ajouter un soin
              </button>
            )}
            <p className="text-xs inline-flex items-center rounded-full bg-black text-white px-4 py-1 tracking-[0.18em] uppercase">
              Prendre soin de vous
            </p>
          </div>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun soin disponible pour le moment.</p>
        ) : (
          /* Liste des catégories + soins */
          <div className="space-y-10">
            {Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => (
              <section key={categoryName} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-900">{categoryName}</h2>
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                    {categoryServices.length} soin{categoryServices.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {categoryServices.map((service) => (
                      <li
                        key={service.id}
                        className="group flex flex-col gap-2 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:gap-6 transition hover:bg-slate-50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 group-hover:text-slate-950">
                            {service.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{service.category?.name}</p>
                        </div>

                        <button
                          onClick={() => navigate(`/soins/${service.slug}${institute ? `?institute=${institute}` : ""}`)}
                          className="text-[11px] uppercase tracking-[0.16em] text-slate-400 group-hover:text-slate-700 hover:underline"
                        >
                          Voir le détail →
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* Modale création de soin */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Créer un nouveau soin</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du soin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex : Rituel éclat signature"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">Choisir une catégorie…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description courte */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description courte
                </label>
                <input
                  type="text"
                  placeholder="En une phrase…"
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </div>

              {/* Description détaillée */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description détaillée
                </label>
                <textarea
                  placeholder="Description complète du soin…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 resize-none"
                />
              </div>

              {/* Durée + Prix */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="60"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix (€)
                  </label>
                  <input
                    type="text"
                    placeholder="95"
                    value={form.priceEuros}
                    onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Image (optionnel)
                </label>

                {/* Onglets */}
                <div className="flex overflow-hidden rounded-xl border border-slate-200 mb-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => { setImageTab("file"); setForm((p) => ({ ...p, imageUrl: "" })); }}
                    className={`flex-1 py-2 transition-colors ${imageTab === "file" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Depuis mon appareil
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageTab("url"); setImageFile(null); setImagePreview(null); }}
                    className={`flex-1 py-2 transition-colors ${imageTab === "url" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Depuis une URL
                  </button>
                </div>

                {imageTab === "file" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img src={imagePreview} alt="Aperçu" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1 hover:bg-black"
                        >
                          Changer
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cliquer pour choisir une image
                        <p className="mt-1 text-xs text-slate-300">JPG, PNG ou WebP · max 5 Mo</p>
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="https://… ou /images/soins/mon-soin.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                )}
              </div>

              {createError && (
                <p className="text-xs text-rose-600">{createError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || uploading}
                  className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
                >
                  {uploading ? "Upload…" : creating ? "Création…" : "Créer le soin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
