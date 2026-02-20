import type { AuthUser } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

// petit helper pour lire un éventuel message d'erreur
function getErrorMessageFromData(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const maybeMsg = (data as { message?: unknown }).message;
    if (typeof maybeMsg === "string") return maybeMsg;
  }
  return `Erreur API (${status})`;
}

export async function request<TResponse = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // pas de JSON, ce n'est pas grave
  }

  if (res.status === 401) {
    // Token expiré ou invalide → on déconnecte et on redirige
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "/connexion";
  }

  if (!res.ok) {
    throw new Error(getErrorMessageFromData(data, res.status));
  }

  return data as TResponse;
}

/* --------- TYPES METIER --------- */

export type CategoryApi = {
  id: number;
  name: string;
  slug: string;
};

export type ServiceOptionApi = {
  id: number;
  name: string;
  duration: number | null;
  priceCents: number;
};

export type ServiceCategoryApi = {
  id: number;
  name: string;
  slug: string;
};

export type ServiceApi = {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  priceCents?: number | null;
  category?: ServiceCategoryApi;
  options?: ServiceOptionApi[];
};

export type AvailabilitySlotApi = {
  start: string;
  end: string;
};

export type PractitionerAvailabilityApi = {
  practitionerId: number;
  practitionerName: string;
  slots: AvailabilitySlotApi[];
};

/* --------- FONCTIONS API --------- */

export function apiGetCategories() {
  return request<{ categories: CategoryApi[] }>("/api/categories");
}

export function apiCreateService(body: {
  name: string;
  slug?: string;
  categoryId: number;
  durationMinutes?: number | null;
  priceCents?: number | null;
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
}) {
  return request<ServiceApi>("/api/services", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiGetServiceBySlug(slug: string) {
  return request<ServiceApi>(`/api/services/${slug}`);
}

export function apiGetAvailability(serviceId: number, date: string) {
  return request<{ practitioners: PractitionerAvailabilityApi[] }>(
    `/api/availability?serviceId=${serviceId}&date=${date}`
  );
}

export function apiCreateAppointment(body: {
  serviceId: number;
  practitionerId: number;
  startAt: string;
  serviceOptionId?: number;
}) {
  return request<{ message: string; appointment: unknown }>(
    "/api/appointments",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}


export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export function apiLogin(email: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Register 

export function apiRegister(body: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  return request<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}


// ---- Types RDV ----
export type AppointmentStatusApi = "upcoming" | "past" | "cancelled";

export type ClientAppointmentApi = {
  id: number;
  date: string;
  treatment: string;
  practitioner?: string;
  location?: string;
  status: AppointmentStatusApi;
};

export type PractitionerAppointmentApi = {
  id: number;
  date: string;
  treatment: string;
  clientName: string;
  status: AppointmentStatusApi;
};

// ---- Fonctions RDV ----
export function apiGetMyAppointments() {
  return request<{ appointments: ClientAppointmentApi[] }>(
    "/api/appointments/me"
  );
}

export function apiGetMyPractitionerAppointments() {
  return request<{ appointments: PractitionerAppointmentApi[] }>(
    "/api/appointments/practitioner/me"
  );
}

export function apiCancelAppointment(id: number) {
  return request<{ message: string }>(
    `/api/appointments/${id}/cancel`,
    {
      method: "POST",
    }
  );
}
export type UserRoleApi = "CLIENT" | "ADMIN" | "ESTHETICIENNE" | "SUPERADMIN";
export type AdminUserApi = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRoleApi;
  isActive: boolean;
  isAdmin?: boolean;
};

export type AdminAppointmentStatusApi = "BOOKED" | "COMPLETED" | "CANCELLED";

export type AdminClientAppointmentApi = {
  id: number;
  startAt: string;
  status: AdminAppointmentStatusApi;
  serviceName: string;
  practitionerName: string;
};

export type AdminPractitionerAppointmentApi = {
  id: number;
  startAt: string;
  status: AdminAppointmentStatusApi;
  serviceName: string;
  clientName: string;
};

// ---- Fonctions Admin ----

export function apiGetUsers() {
  return request<{ users: AdminUserApi[] }>("/api/users");
}

export function apiGetUserAppointments(userId: number) {
  return request<{
    user: AdminUserApi;
    clientAppointments: AdminClientAppointmentApi[];
    practitionerAppointments: AdminPractitionerAppointmentApi[];
  }>(`/api/users/${userId}/appointments`);
}

// ---- Types pour la carte des soins ----
export type PricingServiceApi = {
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

// Liste de tous les services (pour la page tarifs)
export function apiGetPricingServices() {
  return request<PricingServiceApi[] | { services: PricingServiceApi[] }>(
    "/api/services"
  );
}

// Suppression d'un service (admin)
export function apiDeleteService(id: number) {
  return request<{ message: string }>(`/api/services/${id}`, {
    method: "DELETE",
  });
}

export function apiUpdateService(
  id: number,
  body: {
    name?: string;
    shortDescription?: string | null;
    description?: string | null;
    priceCents?: number | null;
    durationMinutes?: number | null;
    imageUrl?: string | null;
    categoryId?: number;
    isActive?: boolean;
  }
) {
  return request<ServiceApi>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// Mettre à jour le rôle d'un utilisateur (admin)
export function apiUpdateUserRole(id: number, role: UserRoleApi) {
  return request<{ user: AdminUserApi }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

// Supprimer un utilisateur (admin)
export function apiDeleteUser(id: number) {
  return request<{ message: string }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}