import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("@workspace/db", async () => {
  const m = await import("./db-mock");
  return m.DB_MODULE_MOCK;
});

import app from "../app";

describe("GET /api/healthz", () => {
  it("returns status ok without authentication", async () => {
    const res = await request(app).get("/api/healthz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
