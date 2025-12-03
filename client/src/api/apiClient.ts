import type { AuthUser } from "../context/AuthContext";
const API_URL = "http://localhost:3000";

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

  if (!res.ok) {
    throw new Error(getErrorMessageFromData(data, res.status));
  }

  return data as TResponse;
}

/* --------- TYPES METIER --------- */

export type ServiceApi = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number | null;
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
