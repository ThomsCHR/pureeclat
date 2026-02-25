import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetPlanning,
  apiCreateStaffAppointment,
  apiUpdateStaffAppointment,
  apiDeleteStaffAppointment,
  apiGetStaffServices,
  apiGetStaffStats,
  apiSearchClients,
  type StaffPractitionerApi,
  type StaffAppointmentApi,
  type StaffServiceApi,
  type StaffStatsPeriod,
  type ClientSearchResultApi,
} from "../api/apiClient";

const INSTITUTES = [
  { id: "paris16",   label: "Paris 16" },
  { id: "lyon",      label: "Lyon" },
  { id: "marseille", label: "Marseille" },
];

const TIME_SLOTS: string[] = [];
for (let h = 9; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function toLocalTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(cents / 100);
}

type NewRdvForm = {
  practitionerId: number;
  practitionerName: string;
  startAt: string;
  slot: string;
};

/* ── Récapitulatif journée / semaine / mois ── */
type Period = "day" | "week" | "month";
type StatsShape = { week: StaffStatsPeriod; month: StaffStatsPeriod } | null;

function PractitionerBreakdown({ rows }: { rows: { id: number; firstName: string; lastName: string; count: number; priceCents: number }[] }) {
  if (rows.length === 0) return <p className="text-xs text-slate-400 py-2">Aucun rendez-vous sur cette période.</p>;
  return (
    <div className="space-y-2 mt-4">
      {rows.map((p) => (
        <div key={p.id} className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-600 border border-slate-200">
            {p.firstName[0]}{p.lastName[0]}
          </span>
          <span className="flex-1 text-sm text-slate-700 font-medium">{p.firstName} {p.lastName}</span>
          <span className="text-xs text-slate-500 mr-2">{p.count} RDV</span>
          <span className="min-w-[72px] text-right text-sm font-semibold text-slate-900">{fmtPrice(p.priceCents)}</span>
        </div>
      ))}
    </div>
  );
}

function DaySummary({ practitioners, stats }: { practitioners: StaffPractitionerApi[]; stats: StatsShape }) {
  const [activePeriod, setActivePeriod] = useState<Period>("day");

  const dayRows = practitioners.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    count: p.appointments.length,
    priceCents: p.appointments.reduce((s, a) => s + (a.customPriceCents ?? a.service?.priceCents ?? 0), 0),
  }));
  const dayCount = dayRows.reduce((s, p) => s + p.count, 0);
  const dayPrice = dayRows.reduce((s, p) => s + p.priceCents, 0);

  const periods: { key: Period; label: string; count: number | null; priceCents: number | null; rows: StaffStatsPeriod["perPractitioner"] | null }[] = [
    { key: "day",   label: "Aujourd'hui",   count: dayCount,               priceCents: dayPrice,                rows: dayRows },
    { key: "week",  label: "Cette semaine", count: stats?.week.count ?? null,  priceCents: stats?.week.priceCents ?? null,  rows: stats?.week.perPractitioner ?? null },
    { key: "month", label: "Ce mois",       count: stats?.month.count ?? null, priceCents: stats?.month.priceCents ?? null, rows: stats?.month.perPractitioner ?? null },
  ];

  const active = periods.find((p) => p.key === activePeriod)!;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-100">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePeriod(p.key)}
            className={`px-4 py-4 text-left transition-colors border-r last:border-r-0 border-slate-100 ${
              activePeriod === p.key ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            <p className={`text-[0.65rem] uppercase tracking-widest mb-1 ${activePeriod === p.key ? "text-slate-300" : "text-slate-400"}`}>
              {p.label}
            </p>
            <p className={`text-lg font-bold leading-tight ${activePeriod === p.key ? "text-white" : "text-slate-900"}`}>
              {p.priceCents !== null ? fmtPrice(p.priceCents) : "—"}
            </p>
            <p className={`text-xs mt-0.5 ${activePeriod === p.key ? "text-slate-300" : "text-slate-500"}`}>
              {p.count !== null ? `${p.count} RDV` : "Chargement…"}
            </p>
          </button>
        ))}
      </div>

      {/* Détail par esthéticienne */}
      <div className="px-5 py-4">
        <p className="text-[0.65rem] uppercase tracking-widest text-slate-400">
          Détail par esthéticienne — {active.label}
        </p>
        {active.rows ? (
          <PractitionerBreakdown rows={active.rows} />
        ) : (
          <p className="text-xs text-slate-400 py-2 mt-4">Chargement…</p>
        )}
      </div>
    </div>
  );
}

/* ── Modale responsive (bottom-sheet mobile / centré desktop) ── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
        {children}
      </div>
    </div>
  );
}

export default function PlanningPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isStaff = isAdmin || user?.role === "ESTHETICIENNE" || user?.role === "SUPERADMIN";

  const [date, setDate] = useState(todayStr());
  const [institute, setInstitute] = useState(INSTITUTES[0].id);
  const [practitioners, setPractitioners] = useState<StaffPractitionerApi[]>([]);
  const [services, setServices] = useState<StaffServiceApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vue mobile : praticienne sélectionnée
  const [mobilePractId, setMobilePractId] = useState<number | null>(null);

  // Modale création
  const [modal, setModal] = useState<NewRdvForm | null>(null);
  const [form, setForm] = useState({ serviceId: "", isCustom: false, customName: "", customPrice: "", customDuration: "60", clientFirstName: "", clientLastName: "", clientPhone: "", clientEmail: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Recherche client
  const [clientSearch, setClientSearch] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<ClientSearchResultApi[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResultApi | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stats semaine / mois
  const [stats, setStats] = useState<StatsShape>(null);

  // Modale édition
  const [editModal, setEditModal] = useState<StaffAppointmentApi | null>(null);
  const [editForm, setEditForm] = useState({ serviceId: "", isCustom: false, customName: "", customPrice: "", customDuration: "60", notes: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user !== undefined && !isStaff) navigate("/");
  }, [user, isStaff, navigate]);

  const loadPlanning = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetPlanning(date, institute);
      setPractitioners(data.practitioners);
      setMobilePractId((prev) => {
        if (prev && data.practitioners.find((p) => p.id === prev)) return prev;
        return data.practitioners[0]?.id ?? null;
      });
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
  useEffect(() => {
    setStats(null);
    apiGetStaffStats(date, institute).then(setStats).catch(() => {});
  }, [date, institute]);

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
    const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    setModal({ practitionerId, practitionerName, startAt: d.toISOString(), slot });
    setForm({ serviceId: "", isCustom: false, customName: "", customPrice: "", customDuration: "60", clientFirstName: "", clientLastName: "", clientPhone: "", clientEmail: "", notes: "" });
    setFormError(null);
    setClientSearch("");
    setClientSuggestions([]);
    setSelectedClient(null);
  }

  function handleClientSearchChange(value: string) {
    setClientSearch(value);
    setSelectedClient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 1) { setClientSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { clients } = await apiSearchClients(value.trim());
        setClientSuggestions(clients);
      } catch { setClientSuggestions([]); }
      finally { setSearchLoading(false); }
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
    setForm((prev) => ({ ...prev, clientFirstName: "", clientLastName: "", clientPhone: "", clientEmail: "" }));
  }

  function openEditModal(appt: StaffAppointmentApi) {
    setEditModal(appt);
    const isCustom = appt.customServiceName !== null;
    setEditForm({
      serviceId: appt.service ? String(appt.service.id) : "",
      isCustom,
      customName: appt.customServiceName ?? "",
      customPrice: appt.customPriceCents != null ? String(appt.customPriceCents / 100) : "",
      customDuration: String(appt.customDurationMinutes ?? 60),
      notes: appt.notes ?? "",
    });
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
        notes: editForm.notes || undefined,
        ...(editForm.isCustom
          ? {
              serviceId: null,
              customServiceName: editForm.customName.trim() || null,
              customPriceCents: editForm.customPrice ? Math.round(parseFloat(editForm.customPrice) * 100) : null,
              customDurationMinutes: editForm.customDuration ? Number(editForm.customDuration) : null,
            }
          : {
              serviceId: editForm.serviceId ? Number(editForm.serviceId) : undefined,
              customServiceName: null,
              customPriceCents: null,
              customDurationMinutes: null,
            }),
      });
      setEditModal(null);
      loadPlanning();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally { setEditSubmitting(false); }
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
    } finally { setEditSubmitting(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    if (!form.clientFirstName || !form.clientLastName || !form.clientPhone) {
      setFormError("Veuillez remplir tous les champs obligatoires."); return;
    }
    if (form.isCustom && !form.customName.trim()) {
      setFormError("Veuillez saisir le nom du soin personnalisé."); return;
    }
    if (!form.isCustom && !form.serviceId) {
      setFormError("Veuillez choisir un soin."); return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await apiCreateStaffAppointment({
        practitionerId: modal.practitionerId,
        startAt: modal.startAt,
        clientFirstName: form.clientFirstName,
        clientLastName: form.clientLastName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || undefined,
        notes: form.notes || undefined,
        ...(form.isCustom
          ? {
              customServiceName: form.customName.trim(),
              customPriceCents: form.customPrice ? Math.round(parseFloat(form.customPrice) * 100) : undefined,
              customDurationMinutes: form.customDuration ? Number(form.customDuration) : undefined,
            }
          : { serviceId: Number(form.serviceId) }),
      });
      setModal(null);
      loadPlanning();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally { setSubmitting(false); }
  }

  if (!isStaff) return null;

  const mobilePract = practitioners.find((p) => p.id === mobilePractId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-16">

        {/* ── Header ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">Staff</p>
            <h1 className="text-2xl font-semibold md:text-3xl">Planning</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Institut */}
            <div className="flex overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-medium shadow-sm w-full sm:w-auto">
              {INSTITUTES.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setInstitute(inst.id)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 transition-colors ${
                    institute === inst.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
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
              className="w-full sm:w-auto rounded-full border border-slate-200 bg-white px-4 py-2.5 sm:py-2 text-sm shadow-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400 py-10 text-center">Chargement du planning…</p>
        ) : practitioners.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Aucune esthéticienne trouvée pour cet institut.
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════
                VUE MOBILE : tabs praticienne + créneaux
                ══════════════════════════════════════ */}
            <div className="md:hidden">
              {/* Tabs praticienne */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {practitioners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setMobilePractId(p.id)}
                    className={`flex-none flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap border ${
                      mobilePractId === p.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      mobilePractId === p.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {p.firstName[0]}{p.lastName[0]}
                    </span>
                    {p.firstName}
                  </button>
                ))}
              </div>

              {/* Créneaux de la praticienne sélectionnée */}
              {mobilePract && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {TIME_SLOTS.map((slot) => {
                    const isFullHour = slot.endsWith(":00");
                    const appt = getAppointmentAt(mobilePract.id, slot);
                    const isStart = isSlotStart(mobilePract.id, slot);

                    // Créneau occupé (continuation) → ne pas afficher
                    if (appt && !isStart) return null;

                    return (
                      <div
                        key={slot}
                        className={`flex items-stretch gap-3 px-3 border-b last:border-b-0 ${
                          isFullHour ? "border-slate-200 bg-slate-50/60" : "border-slate-100"
                        }`}
                      >
                        {/* Heure */}
                        <div className={`w-12 shrink-0 flex items-center py-2 ${
                          isFullHour ? "text-sm font-semibold text-slate-700" : "text-xs text-slate-400"
                        }`}>
                          {slot}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 py-1.5">
                          {appt ? (
                            <button
                              onClick={() => openEditModal(appt)}
                              className="w-full text-left rounded-xl bg-amber-100 border border-amber-200 px-3 py-2.5 hover:bg-amber-200 transition-colors"
                            >
                              <p className="text-sm font-semibold text-amber-900">{appt.client.firstName} {appt.client.lastName}</p>
                              <p className="text-xs text-amber-700 mt-0.5">
                                {appt.customServiceName ?? appt.service?.name}
                                {appt.customPriceCents != null && <span className="ml-1 font-semibold">{fmtPrice(appt.customPriceCents)}</span>}
                              </p>
                              <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                                {toLocalTime(appt.startAt)} – {toLocalTime(appt.endAt)}
                              </p>
                              {appt.client.phone && <p className="text-[11px] text-amber-500">{appt.client.phone}</p>}
                              {appt.notes && (
                                <p className="mt-1 text-[11px] italic text-amber-600 border-t border-amber-200 pt-1 truncate">{appt.notes}</p>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => openModal(mobilePract.id, `${mobilePract.firstName} ${mobilePract.lastName}`, slot)}
                              className={`w-full rounded-lg border border-dashed py-2 text-xs transition-colors ${
                                isFullHour
                                  ? "border-slate-300 text-slate-400 hover:border-slate-500 hover:bg-slate-50"
                                  : "border-slate-200 text-slate-300 hover:border-slate-400"
                              }`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════
                VUE DESKTOP : tableau
                ══════════════════════════════════════ */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="w-20 py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sticky left-0 bg-slate-50">
                      Heure
                    </th>
                    {practitioners.map((p) => (
                      <th key={p.id} className="min-w-[180px] py-4 px-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 shrink-0">
                            {p.firstName[0]}{p.lastName[0]}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{p.firstName} {p.lastName}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => {
                    const isFullHour = slot.endsWith(":00");
                    return (
                      <tr key={slot} className={isFullHour ? "border-t border-slate-200 bg-slate-50/60" : "border-t border-slate-100"}>
                        <td className={`py-3 px-4 whitespace-nowrap sticky left-0 ${
                          isFullHour ? "bg-slate-50/60 text-sm font-semibold text-slate-600" : "bg-white text-xs text-slate-400"
                        }`}>
                          {slot}
                        </td>
                        {practitioners.map((p) => {
                          const appt = getAppointmentAt(p.id, slot);
                          const isStart = isSlotStart(p.id, slot);

                          if (appt && !isStart) return <td key={p.id} className="py-0 px-2 bg-amber-50 border-l border-amber-100" />;

                          if (appt && isStart) return (
                            <td key={p.id} className="py-1.5 px-2 border-l border-slate-100">
                              <button onClick={() => openEditModal(appt)} className="w-full text-left rounded-xl bg-amber-100 border border-amber-200 px-3 py-2.5 hover:bg-amber-200 transition-colors shadow-sm">
                                <p className="text-sm font-semibold text-amber-900 leading-tight">{appt.client.firstName} {appt.client.lastName}</p>
                                <p className="mt-0.5 text-xs text-amber-700">
                                  {appt.customServiceName ?? appt.service?.name}
                                  {appt.customPriceCents != null && <span className="ml-1 font-semibold">{fmtPrice(appt.customPriceCents)}</span>}
                                </p>
                                <p className="mt-0.5 text-[11px] text-amber-500 font-medium">{toLocalTime(appt.startAt)} – {toLocalTime(appt.endAt)}</p>
                                {appt.client.phone && <p className="mt-0.5 text-[11px] text-amber-500">{appt.client.phone}</p>}
                                {appt.notes && <p className="mt-1 text-[11px] italic text-amber-600 truncate max-w-[160px] border-t border-amber-200 pt-1">{appt.notes}</p>}
                              </button>
                            </td>
                          );

                          return (
                            <td key={p.id} className="py-1.5 px-2 border-l border-slate-100">
                              <button
                                onClick={() => openModal(p.id, `${p.firstName} ${p.lastName}`, slot)}
                                className={`w-full rounded-lg border border-dashed py-2.5 text-xs transition-colors ${
                                  isFullHour ? "border-slate-300 text-slate-300 hover:border-slate-500 hover:text-slate-500 hover:bg-slate-50" : "border-slate-200 text-slate-200 hover:border-slate-400 hover:text-slate-400"
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
            </div>

            {/* ══════════════════════════════════════
                RÉCAPITULATIF
                ══════════════════════════════════════ */}
            <DaySummary practitioners={practitioners} stats={stats} />
          </>
        )}
      </div>

      {/* ── Modale édition ── */}
      {editModal && (
        <Modal onClose={() => { setEditModal(null); setConfirmDelete(false); }}>
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Modifier le rendez-vous</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editModal.client.firstName} {editModal.client.lastName} · {toLocalTime(editModal.startAt)} – {toLocalTime(editModal.endAt)}
                </p>
              </div>
              <span className="text-xs text-slate-400 mt-1 shrink-0">{editModal.client.phone}</span>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Soin</label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isCustom: !editForm.isCustom, serviceId: "", customName: "", customPrice: "", customDuration: "60" })}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      editForm.isCustom ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {editForm.isCustom ? "← Catalogue" : "Soin personnalisé"}
                  </button>
                </div>
                {!editForm.isCustom ? (
                  <select value={editForm.serviceId} onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900">
                    <option value="">Choisir un soin…</option>
                    {services.map((s) => <option key={s.id} value={s.id}>{s.name} {s.durationMinutes ? `(${s.durationMinutes} min)` : ""}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      placeholder="Nom du soin *"
                      value={editForm.customName}
                      onChange={(e) => setEditForm({ ...editForm, customName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Prix (€)"
                          value={editForm.customPrice}
                          onChange={(e) => setEditForm({ ...editForm, customPrice: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 pr-6"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          placeholder="Durée (min)"
                          value={editForm.customDuration}
                          onChange={(e) => setEditForm({ ...editForm, customDuration: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes internes</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 resize-none" placeholder="Notes internes optionnelles…" />
              </div>
              {editError && <p className="text-xs text-rose-600">{editError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditModal(null); setConfirmDelete(false); }} className="flex-1 rounded-full border border-slate-200 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" disabled={editSubmitting} className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50">{editSubmitting ? "Sauvegarde…" : "Enregistrer"}</button>
              </div>
            </form>

            <div className="mt-4 border-t pt-4">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="w-full rounded-full border border-rose-200 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">Supprimer ce rendez-vous</button>
              ) : (
                <div className="space-y-2">
                  <p className="text-center text-xs text-slate-600">Confirmer la suppression ?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-full border border-slate-200 py-3 text-xs text-slate-600 hover:bg-slate-50">Non</button>
                    <button onClick={handleDelete} disabled={editSubmitting} className="flex-1 rounded-full bg-rose-600 py-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{editSubmitting ? "…" : "Oui, supprimer"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modale création ── */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Nouveau rendez-vous</h2>
            <p className="text-xs text-slate-500 mb-5">{modal.practitionerName} · {date} à {modal.slot}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Soin */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Soin <span className="text-rose-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isCustom: !form.isCustom, serviceId: "", customName: "", customPrice: "", customDuration: "60" })}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      form.isCustom ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {form.isCustom ? "← Catalogue" : "Soin personnalisé"}
                  </button>
                </div>
                {!form.isCustom ? (
                  <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900">
                    <option value="">Choisir un soin…</option>
                    {services.map((s) => <option key={s.id} value={s.id}>{s.name} {s.durationMinutes ? `(${s.durationMinutes} min)` : ""}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      placeholder="Nom du soin *"
                      value={form.customName}
                      onChange={(e) => setForm({ ...form, customName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Prix (€)"
                          value={form.customPrice}
                          onChange={(e) => setForm({ ...form, customPrice: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 pr-6"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          placeholder="Durée (min)"
                          value={form.customDuration}
                          onChange={(e) => setForm({ ...form, customDuration: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Client <span className="text-rose-500">*</span></label>

                {!selectedClient ? (
                  <div className="relative mb-3">
                    <input type="text" placeholder="Rechercher un client (nom, téléphone…)" value={clientSearch} onChange={(e) => handleClientSearchChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
                    {searchLoading && <span className="absolute right-3 top-3 text-xs text-slate-400">…</span>}
                    {clientSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                        {clientSuggestions.map((c) => (
                          <li key={c.id}>
                            <button type="button" onClick={() => selectExistingClient(c)} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors">
                              <span className="text-sm font-medium text-slate-900">{c.firstName} {c.lastName}</span>
                              {c.phone && <span className="ml-2 text-xs text-slate-500">{c.phone}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {clientSearch.length >= 1 && !searchLoading && clientSuggestions.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">Aucun client trouvé — remplir manuellement.</p>
                    )}
                  </div>
                ) : (
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                      <p className="text-xs text-emerald-700">{selectedClient.phone}</p>
                    </div>
                    <button type="button" onClick={clearSelectedClient} className="text-xs text-emerald-600 hover:text-emerald-900 underline">Changer</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Prénom *" value={form.clientFirstName} onChange={(e) => setForm({ ...form, clientFirstName: e.target.value })} disabled={!!selectedClient} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-50" />
                  <input placeholder="Nom *" value={form.clientLastName} onChange={(e) => setForm({ ...form, clientLastName: e.target.value })} disabled={!!selectedClient} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-50" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input placeholder="Téléphone *" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} disabled={!!selectedClient} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-50" />
                  <input placeholder="Email (optionnel)" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} disabled={!!selectedClient} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-50" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes internes (optionnel)</label>
                <textarea placeholder="Ex : client VIP, allergie…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 resize-none" />
              </div>

              {formError && <p className="text-xs text-rose-600">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-full border border-slate-200 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50">{submitting ? "Création…" : "Créer le RDV"}</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
