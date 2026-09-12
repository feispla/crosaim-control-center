export const APPLICATION_STATUSES = [
  "POSTULACIÓN",
  "REVISIÓN",
  "ENTREVISTA",
  "APROBADA",
  "RECHAZADA",
  "ROSTER",
  "TRYOUT",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  "POSTULACIÓN": ["REVISIÓN", "RECHAZADA"],
  "REVISIÓN": ["ENTREVISTA", "RECHAZADA"],
  "ENTREVISTA": ["APROBADA", "RECHAZADA", "TRYOUT"],
  "APROBADA": ["ROSTER", "TRYOUT"],
  "TRYOUT": ["ROSTER", "RECHAZADA"],
  "ROSTER": [],
  "RECHAZADA": [],
};

const LEGACY_STATUS: Record<string, ApplicationStatus> = {
  pendiente: "POSTULACIÓN",
  postulacion: "POSTULACIÓN",
  "postulación": "POSTULACIÓN",
  "en revision": "REVISIÓN",
  revision: "REVISIÓN",
  "revisión": "REVISIÓN",
  entrevista: "ENTREVISTA",
  aprobada: "APROBADA",
  rechazada: "RECHAZADA",
  roster: "ROSTER",
  tryout: "TRYOUT",
};

export function canonicalApplicationStatus(value: string): ApplicationStatus {
  const raw = value.trim();
  if ((APPLICATION_STATUSES as readonly string[]).includes(raw)) return raw as ApplicationStatus;
  const legacy = LEGACY_STATUS[raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()];
  if (!legacy) throw new Error(`Estado de postulación no válido: ${value}`);
  return legacy;
}

export function canTransitionApplication(from: string, to: string): boolean {
  const source = canonicalApplicationStatus(from);
  const destination = canonicalApplicationStatus(to);
  return source === destination || APPLICATION_TRANSITIONS[source].includes(destination);
}

export function eventForApplicationStatus(status: ApplicationStatus): string | null {
  return {
    "POSTULACIÓN": "application_submitted",
    "REVISIÓN": "application_review",
    "ENTREVISTA": "application_interview",
    "APROBADA": "application_approved",
    "RECHAZADA": "application_rejected",
    "ROSTER": "role_updated",
    "TRYOUT": "roster_tryout",
  }[status];
}
