import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGetUsers, type AdminUserApi } from "../api/apiClient";

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetUsers();
        setUsers(data.users);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, navigate]);

  if (loading) return <p className="p-8">Chargement…</p>;

  // 🔍 Normalisation tel : "06 12 34 56 78" → "0612345678"
  const normalizePhone = (phone?: string | null) =>
    (phone ?? "").replace(/\D/g, "");

  const normalizedSearch = search.toLowerCase().trim();
  const normalizedSearchDigits = search.replace(/\D/g, "");

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const email = u.email.toLowerCase();
    const phone = normalizePhone(u.phone);

    return (
      fullName.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      (normalizedSearchDigits && phone.includes(normalizedSearchDigits))
    );
  });

  return (
    <div className="min-h-screen bg-[#FFF5ED] px-4 py-20">
      <div className="mx-auto max-w-4xl bg-white/90 border border-[#ead8c7] shadow rounded-2xl p-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 underline"
        >
          ← Retour
        </button>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">Utilisateurs inscrits</h1>

          {/* 🔍 Barre de recherche */}
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun utilisateur trouvé.</p>
        ) : (
          <>
            {/* 🟢 Version mobile : cartes empilées */}
            <div className="space-y-3 md:hidden">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => navigate(`/admin/users/${u.id}/appointments`)}
                  className="w-full text-left rounded-2xl border border-[#ead8c7] bg-white px-4 py-3 shadow-sm active:scale-[0.99] transition"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{u.email}</p>
                  <p className="text-xs text-slate-500">
                    Tél : {u.phone ?? "-"}
                  </p>
                  <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-700">
                    Rôle : {u.role}
                  </p>
                </button>
              ))}
            </div>

            {/* 🖥️ Version desktop : tableau */}
            <div className="hidden md:block">
              <table className="w-full text-sm border-collapse mt-2">
                <thead className="bg-[#fdf4ec]">
                  <tr>
                    <th className="text-left px-4 py-2">Nom</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Téléphone</th>
                    <th className="text-left px-4 py-2">Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/users/${u.id}/appointments`)
                          }
                          className="text-sm font-medium text-slate-900 hover:underline hover:text-slate-700"
                        >
                          {u.firstName} {u.lastName}
                        </button>
                      </td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.phone ?? "-"}</td>
                      <td className="px-4 py-2">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
