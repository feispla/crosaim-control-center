import { describe, expect, it } from "vitest";
import { canTransitionApplication, canonicalApplicationStatus, eventForApplicationStatus } from "./applicationState";

describe("CROSAIM application workflow", () => {
  it("normalizes existing status values", () => {
    expect(canonicalApplicationStatus("Pendiente")).toBe("POSTULACIÓN");
    expect(canonicalApplicationStatus("En revisión")).toBe("REVISIÓN");
    expect(canonicalApplicationStatus("ROSTER")).toBe("ROSTER");
  });

  it("allows only declared state transitions", () => {
    expect(canTransitionApplication("POSTULACIÓN", "REVISIÓN")).toBe(true);
    expect(canTransitionApplication("REVISIÓN", "ENTREVISTA")).toBe(true);
    expect(canTransitionApplication("ENTREVISTA", "TRYOUT")).toBe(true);
    expect(canTransitionApplication("TRYOUT", "ROSTER")).toBe(true);
    expect(canTransitionApplication("RECHAZADA", "ROSTER")).toBe(false);
  });

  it("maps user-visible transitions to Discord events", () => {
    expect(eventForApplicationStatus("ENTREVISTA")).toBe("application_interview");
    expect(eventForApplicationStatus("APROBADA")).toBe("application_approved");
    expect(eventForApplicationStatus("ROSTER")).toBe("role_updated");
  });
});
