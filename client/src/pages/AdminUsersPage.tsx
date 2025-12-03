import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  apiGetUsers,
  type AdminUserApi,
} from "../api/apiClient";

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#FFF5ED] px-4 py-20">
      <div className="mx-auto max-w-4xl bg-white/90 border border-[#ead8c7] shadow rounded-2xl p-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 underline mb-4"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-semibold mb-6">Utilisateurs inscrits</h1>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#fdf4ec]">
            <tr>
              <th className="text-left px-4 py-2">Nom</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Téléphone</th>
              <th className="text-left px-4 py-2">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
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
    </div>
  );
}
