import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetPlanning,
  apiCreateStaffAppointment,
  apiUpdateStaffAppointment,
  apiDeleteStaffAppointment,
  apiGetStaffServices,
  apiSearchClients,
  type StaffPractitionerApi,
  type StaffAppointmentApi,
  type StaffServiceApi,
  type ClientSearchResultApi,
} from "../api/apiClient";

const INSTITUTES = [
  { id: "paris16",    label: "Paris 16" },
  { id: "lyon",       label: "Lyon" },
  { id: "marseille",  label: "Marseille" },
];

// Créneaux de 9h à 18h par tranches de 30 min (heure locale)
const TIME_SLOTS: string[] = [];
for (let h = 9; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function toLocalTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type NewRdvForm = {
  practitionerId: number;
  practitionerName: string;
  startAt: string; // ISO
  slot: string;    // "HH:MM"
};

export default function PlanningPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isStaff =
    isAdmin ||
    user?.role === "ESTHETICIENNE" ||
    user?.role === "SUPERADMIN";

  const [date, setDate] = useState(todayStr());
  const [institute, setInstitute] = useState(INSTITUTES[0].id);
  const [practitioners, setPractitioners] = useState<StaffPractitionerApi[]>([]);
  const [services, setServices] = useState<StaffServiceApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modale création
  const [modal, setModal] = useState<NewRdvForm | null>(null);
  const [form, setForm] = useState({
    serviceId: "",
    clientFirstName: "",
    clientLastName: "",
    clientPhone: "",
    clientEmail: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Recherche client existant
  const [clientSearch, setClientSearch] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<ClientSearchResultApi[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResultApi | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modale édition
  const [editModal, setEditModal] = useState<StaffAppointmentApi | null>(null);
  const [editForm, setEditForm] = useState({ serviceId: "", notes: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Redirection si non staff
  useEffect(() => {
    if (user !== undefined && !isStaff) navigate("/");
  }, [user, isStaff, navigate]);

  const loadPlanning = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetPlanning(date, institute);
      setPractitioners(data.practitioners);
    } catch {
      setError("Impossible de charger le planning.");
    } finally {
      setLoading(false);
    }
  }, [date, institute]);

  useEffect(() => { loadPlanning(); }, [loadPlanning]);

  useEffect(() => {
    apiGetStaffServices().then((d) => setServices(d.services)).catch(() => {});
  }, []);

  // Détermine si un créneau est occupé pour un praticien
  function getAppointmentAt(practitionerId: number, slot: string) {
    const p = practitioners.find((pr) => pr.id === practitionerId);
    if (!p) return null;
    return p.appointments.find((a) => {
      const start = toLocalTime(a.startAt);
      const end = toLocalTime(a.endAt);
      return slot >= start && slot < end;
    }) ?? null;
  }

  function isSlotStart(practitionerId: number, slot: string) {
    const p = practitioners.find((pr) => pr.id === practitionerId);
    if (!p) return false;
    return p.appointments.some((a) => toLocalTime(a.startAt) === slot);
  }

  function openModal(practitionerId: number, practitionerName: string, slot: string) {
    const [h, m] = slot.split(":").map(Number);
    const d = new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
    setModal({
      practitionerId,
      practitionerName,
      startAt: d.toISOString(),
      slot,
    });
    setForm({ serviceId: "", clientFirstName: "", clientLastName: "", clientPhone: "", clientEmail: "", notes: "" });
    setFormError(null);
    setClientSearch("");
    setClientSuggestions([]);
    setSelectedClient(null);
  }

  function handleClientSearchChange(value: string) {
    setClientSearch(value);
    setSelectedClient(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 1) {
      setClientSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { clients } = await apiSearchClients(value.trim());
        setClientSuggestions(clients);
      } catch {
        setClientSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }

  function selectExistingClient(c: ClientSearchResultApi) {
    setSelectedClient(c);
    setClientSearch(`${c.firstName} ${c.lastName}`);
    setClientSuggestions([]);
    setForm((prev) => ({
      ...prev,
      clientFirstName: c.firstName,
      clientLastName: c.lastName,
      clientPhone: c.phone ?? "",
      clientEmail: c.email.endsWith("@walkin.pureeclat.fr") ? "" : c.email,
    }));
  }

  function clearSelectedClient() {
    setSelectedClient(null);
    setClientSearch("");
    setForm((prev) => ({
      ...prev,
      clientFirstName: "",
      clientLastName: "",
      clientPhone: "",
      clientEmail: "",
    }));
  }

  function openEditModal(appt: StaffAppointmentApi) {
    setEditModal(appt);
    setEditForm({ serviceId: String(appt.service.id), notes: appt.notes ?? "" });
    setEditError(null);
    setConfirmDelete(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      await apiUpdateStaffAppointment(editModal.id, {
        serviceId: Number(editForm.serviceId),
        notes: editForm.notes || undefined,
      });
      setEditModal(null);
      loadPlanning();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editModal) return;
    try {
      setEditSubmitting(true);
      await apiDeleteStaffAppointment(editModal.id);
      setEditModal(null);
      loadPlanning();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    if (!form.serviceId || !form.clientFirstName || !form.clientLastName || !form.clientPhone) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await apiCreateStaffAppointment({
        practitionerId: modal.practitionerId,
        serviceId: Number(form.serviceId),
        startAt: modal.startAt,
        clientFirstName: form.clientFirstName,
        clientLastName: form.clientLastName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || undefined,
        notes: form.notes || undefined,
      });
      setModal(null);
      loadPlanning();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isStaff) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 pb-16">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">Staff</p>
            <h1 className="text-2xl font-semibold md:text-3xl">Planning</h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {/* Institut */}
            <div className="flex overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-medium shadow-sm">
              {INSTITUTES.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setInstitute(inst.id)}
                  className={`px-4 py-2 transition-colors ${
                    institute === inst.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {inst.label}
                </button>
              ))}
            </div>

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Chargement du planning…</p>
        ) : (
          /* Grille planning */
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="w-20 py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sticky left-0 bg-slate-50">
                    Heure
                  </th>
                  {practitioners.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[180px] py-4 px-4 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => {
                  const isFullHour = slot.endsWith(":00");
                  return (
                    <tr
                      key={slot}
                      className={`${
                        isFullHour
                          ? "border-t border-slate-200 bg-slate-50/60"
                          : "border-t border-slate-100"
                      }`}
                    >
                      <td className={`py-3 px-4 whitespace-nowrap sticky left-0 ${
                        isFullHour
                          ? "bg-slate-50/60 text-sm font-semibold text-slate-600"
                          : "bg-white text-xs text-slate-400"
                      }`}>
                        {slot}
                      </td>
                      {practitioners.map((p) => {
                        const appt = getAppointmentAt(p.id, slot);
                        const isStart = isSlotStart(p.id, slot);

                        if (appt && !isStart) {
                          return (
                            <td
                              key={p.id}
                              className="py-0 px-2 bg-amber-50 border-l border-amber-100"
                            />
                          );
                        }

                        if (appt && isStart) {
                          return (
                            <td key={p.id} className="py-1.5 px-2 border-l border-slate-100">
                              <button
                                onClick={() => openEditModal(appt)}
                                className="w-full text-left rounded-xl bg-amber-100 border border-amber-200 px-3 py-2.5 hover:bg-amber-200 transition-colors shadow-sm"
                              >
                                <p className="text-sm font-semibold text-amber-900 leading-tight">
                                  {appt.client.firstName} {appt.client.lastName}
                                </p>
                                <p className="mt-0.5 text-xs text-amber-700">
                                  {appt.service.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-amber-500 font-medium">
                                  {toLocalTime(appt.startAt)} – {toLocalTime(appt.endAt)}
                                </p>
                                {appt.client.phone && (
                                  <p className="mt-0.5 text-[11px] text-amber-500">
                                    {appt.client.phone}
                                  </p>
                                )}
                                {appt.notes && (
                                  <p className="mt-1 text-[11px] italic text-amber-600 truncate max-w-[160px] border-t border-amber-200 pt-1">
                                    {appt.notes}
                                  </p>
                                )}
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td key={p.id} className="py-1.5 px-2 border-l border-slate-100">
                            <button
                              onClick={() => openModal(p.id, `${p.firstName} ${p.lastName}`, slot)}
                              className={`w-full rounded-lg border border-dashed py-2.5 text-xs transition-colors
                                ${isFullHour
                                  ? "border-slate-300 text-slate-300 hover:border-slate-500 hover:text-slate-500 hover:bg-slate-50"
                                  : "border-slate-200 text-slate-200 hover:border-slate-400 hover:text-slate-400"
                                }`}
                            >
                              +
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {practitioners.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-400">
                Aucune esthéticienne trouvée pour cet institut.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale édition / suppression RDV */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setEditModal(null); setConfirmDelete(false); } }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Modifier le rendez-vous</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editModal.client.firstName} {editModal.client.lastName} · {toLocalTime(editModal.startAt)} – {toLocalTime(editModal.endAt)}
                </p>
              </div>
              <span className="text-xs text-slate-400 mt-1">{editModal.client.phone}</span>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Soin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Soin</label>
                <select
                  value={editForm.serviceId}
                  onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.durationMinutes ? `(${s.durationMinutes} min)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes internes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 resize-none"
                  placeholder="Notes internes optionnelles…"
                />
              </div>

              {editError && <p className="text-xs text-rose-600">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setEditModal(null); setConfirmDelete(false); }}
                  className="flex-1 rounded-full border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 rounded-full bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
                >
                  {editSubmitting ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </div>
            </form>

            {/* Suppression */}
            <div className="mt-4 border-t pt-4">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-full border border-rose-200 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Supprimer ce rendez-vous
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-center text-xs text-slate-600">Confirmer la suppression ?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-full border border-slate-200 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Non
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={editSubmitting}
                      className="flex-1 rounded-full bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {editSubmitting ? "…" : "Oui, supprimer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale création RDV */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Nouveau rendez-vous</h2>
            <p className="text-xs text-slate-500 mb-5">
              {modal.practitionerName} · {date} à {modal.slot}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Soin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Soin <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">Choisir un soin…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.durationMinutes ? `(${s.durationMinutes} min)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Client <span className="text-rose-500">*</span>
                </label>

                {/* Recherche client existant */}
                {!selectedClient ? (
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Rechercher un client existant (nom, téléphone…)"
                      value={clientSearch}
                      onChange={(e) => handleClientSearchChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    {searchLoading && (
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">…</span>
                    )}
                    {clientSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                        {clientSuggestions.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => selectExistingClient(c)}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-slate-900">
                                {c.firstName} {c.lastName}
                              </span>
                              {c.phone && (
                                <span className="ml-2 text-xs text-slate-500">{c.phone}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {clientSearch.length >= 1 && !searchLoading && clientSuggestions.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">Aucun client trouvé — remplir manuellement ci-dessous.</p>
                    )}
                  </div>
                ) : (
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                      <p className="text-xs text-emerald-700">{selectedClient.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedClient}
                      className="text-xs text-emerald-600 hover:text-emerald-900 underline"
                    >
                      Changer
                    </button>
                  </div>
                )}

                {/* Champs manuels (désactivés si client sélectionné) */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Prénom *"
                    value={form.clientFirstName}
                    onChange={(e) => setForm({ ...form, clientFirstName: e.target.value })}
                    disabled={!!selectedClient}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-50"
                  />
                  <input
                    placeholder="Nom *"
                    value={form.clientLastName}
                    onChange={(e) => setForm({ ...form, clientLastName: e.target.value })}
                    disabled={!!selectedClient}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-50"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    placeholder="Téléphone *"
                    value={form.clientPhone}
                    onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    disabled={!!selectedClient}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-50"
                  />
                  <input
                    placeholder="Email (optionnel)"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    disabled={!!selectedClient}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes internes (optionnel)
                </label>
                <textarea
                  placeholder="Ex : client VIP, allergie à la lavande…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 rounded-full border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-full bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
                >
                  {submitting ? "Création…" : "Créer le RDV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
