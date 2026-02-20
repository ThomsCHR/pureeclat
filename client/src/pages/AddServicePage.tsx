import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetCategories, apiCreateService, type CategoryApi } from "../api/apiClient";

type Category = CategoryApi;

export default function AddServicePage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Vérification admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiGetCategories();
        setCategories(data.categories);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Impossible de charger les catégories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Pré-sélection via ?category=slug
  useEffect(() => {
    const slugFromUrl = searchParams.get("category");
    if (slugFromUrl && categories.length > 0) {
      const cat = categories.find((c) => c.slug === slugFromUrl);
      if (cat) setCategoryId(cat.id);
    }
  }, [categories, searchParams]);

  // Générer slug auto
  const handleNameChange = (value: string) => {
    setName(value);
    const s = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !categoryId) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await apiCreateService({
        name,
        slug,
        categoryId,
        durationMinutes: duration,
        priceCents,
        shortDescription,
        description,
        imageUrl,
      });

      navigate("/tarifs");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Chargement...</p>;
  }

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-24 px-4 text-slate-900">
      <div className="mx-auto max-w-3xl bg-white/90 rounded-2xl shadow p-6 border border-[#ead8c7]">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 underline underline-offset-4"
        >
          ← Retour
        </button>

        <h1 className="mt-4 text-3xl font-semibold">Ajouter un soin</h1>
        <p className="text-slate-600 text-sm mb-6">Créer un nouveau soin dans la carte.</p>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NOM */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom du soin *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          {/* CATÉGORIE */}
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              required
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* DURÉE */}
          <div>
            <label className="block text-sm font-medium mb-1">Durée (min)</label>
            <input
              type="number"
              value={duration ?? ""}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* PRIX */}
          <div>
            <label className="block text-sm font-medium mb-1">Prix (€)</label>
            <input
              type="number"
              value={priceCents ? priceCents / 100 : ""}
              onChange={(e) => setPriceCents(Number(e.target.value) * 100)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* DESCRIPTION COURTE */}
          <div>
            <label className="block text-sm font-medium mb-1">Description courte</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium mb-1">Description détaillée</label>
            <textarea
              value={description}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="block text-sm font-medium mb-1">Image (URL)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-black text-white py-3 font-semibold hover:bg-slate-900 transition"
          >
            {saving ? "Création..." : "Créer le soin"}
          </button>
        </form>
      </div>
    </div>
  );
}
