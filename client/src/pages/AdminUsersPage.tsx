import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  apiGetUsers,
  apiUpdateUserRole,
  apiUpdateUserInfo,
  apiDeleteUser,
  apiCreateUser,
  type AdminUserApi,
  type UserRoleApi,
} from "../api/apiClient";

export default function AdminUsersPage() {
  const { isAdmin, isSuperAdmin, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // id de l'utilisateur en cours de mise à jour (pour désactiver le select)
  const [savingId, setSavingId] = useState<number | null>(null);

  // modale édition infos
  const [editUser, setEditUser] = useState<AdminUserApi | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // modale création client
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const displayEmail = (email: string) =>
    email.endsWith("@walkin.pureeclat.fr") ? "—" : email;

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

  // 🔧 Changement de rôle (CLIENT / ADMIN / ESTHETICIENNE / SUPERADMIN)
  const handleChangeRole = async (userId: number, newRole: UserRoleApi) => {
    try {
      setSavingId(userId);
      const { user } = await apiUpdateUserRole(userId, newRole);

      // mettre à jour la liste locale
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le rôle.");
    } finally {
      setSavingId(null);
    }
  };

  // 🗑️ Suppression d’un utilisateur (non admin / non superadmin)
  const handleDeleteUser = async (user: AdminUserApi) => {
    if (
      !window.confirm(
        `Supprimer le compte de ${user.firstName} ${user.lastName} ?`
      )
    ) {
      return;
    }

    try {
      await apiDeleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Impossible de supprimer cet utilisateur.");
    }
  };

  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateSaving(true);
      setCreateError(null);
      const { user } = await apiCreateUser({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        phone: createForm.phone || undefined,
        password: createForm.password || undefined,
      });
      setUsers((prev) => [user, ...prev]);
      setShowCreate(false);
      setCreateForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setCreateSaving(false);
    }
  };

  const openEditUser = (u: AdminUserApi) => {
    setEditUser(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? "" });
    setEditError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      setEditSaving(true);
      setEditError(null);
      const { user } = await apiUpdateUserInfo(editUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || null,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      setEditUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally {
      setEditSaving(false);
    }
  };

  // helper pour savoir si on peut éditer le rôle de cet utilisateur
  const canEditRole = (u: AdminUserApi) => {
    // Déjà en cours d'enregistrement
    if (savingId === u.id) return false;

    // On évite de se changer soi-même (optionnel mais plus safe)
    if (authUser && authUser.id === u.id) return false;

    // Un non-SUPERADMIN ne touche jamais aux admins ni superadmins
    if (!isSuperAdmin && (u.role === "ADMIN" || u.role === "SUPERADMIN")) {
      return false;
    }

    // Même un SUPERADMIN ne modifie pas un SUPERADMIN (autre ou lui-même)
    if (u.role === "SUPERADMIN") return false;

    return true;
  };

  // helper pour savoir si on peut supprimer cet utilisateur
  const canDeleteUser = (u: AdminUserApi) => {
    // On ne supprime jamais ADMIN ni SUPERADMIN
    if (u.role === "ADMIN" || u.role === "SUPERADMIN") return false;

    // Optionnel : ne pas se supprimer soi-même
    if (authUser && authUser.id === u.id) return false;

    return true;
  };

  return (
    <>
    <div className="min-h-screen bg-[#FFF5ED] px-4 py-20">
      <div className="mx-auto max-w-4xl bg-white/90 border border-[#ead8c7] shadow rounded-2xl p-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-600 underline"
        >
          ← Retour
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Utilisateurs inscrits</h1>
            <button
              type="button"
              onClick={() => { setShowCreate(true); setCreateError(null); }}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Ajouter un client
            </button>
          </div>

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
                <div
                  key={u.id}
                  className="w-full rounded-2xl border border-[#ead8c7] bg-white px-4 py-3 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/users/${u.id}/appointments`)
                    }
                    className="w-full text-left"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{displayEmail(u.email)}</p>
                    <p className="text-xs text-slate-500">
                      Tél : {u.phone ?? "-"}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-700">
                      Rôle : {u.role}
                    </p>
                  </button>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleChangeRole(u.id, e.target.value as UserRoleApi)
                      }
                      disabled={!canEditRole(u)}
                      className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                    >
                      <option value="CLIENT">Client</option>
                      <option value="ESTHETICIENNE">Esthéticienne</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Superadmin</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                      >
                        Modifier
                      </button>
                      {canDeleteUser(u) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const editable = canEditRole(u);
                    const deletable = canDeleteUser(u);

                    return (
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
                        <td className="px-4 py-2">{displayEmail(u.email)}</td>
                        <td className="px-4 py-2">{u.phone ?? "-"}</td>
                        <td className="px-4 py-2">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleChangeRole(
                                u.id,
                                e.target.value as UserRoleApi
                              )
                            }
                            className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs"
                            disabled={!editable}
                          >
                            <option value="CLIENT">Client</option>
                            <option value="ESTHETICIENNE">
                              Esthéticienne
                            </option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERADMIN">Superadmin</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEditUser(u)}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                            >
                              Modifier
                            </button>
                            {deletable && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Modale création client */}
    {showCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold">Ajouter un client</h2>

          {createError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <form onSubmit={handleCreateSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input
                type="text"
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input
                type="text"
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mot de passe <span className="text-slate-400">(optionnel — généré auto si vide)</span>
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={createSaving}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createSaving}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createSaving ? "Création…" : "Créer le client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Modale édition infos utilisateur */}

    {editUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold">
            Modifier {editUser.firstName} {editUser.lastName}
          </h2>

          {editError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}

          <form onSubmit={handleEditSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                disabled={editSaving}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {editSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
