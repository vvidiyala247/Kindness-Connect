import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockSchool, studentToken, adminToken, schoolId } from "./fixtures";

vi.mock("@workspace/db", async () => {
  const m = await import("./db-mock");
  return m.DB_MODULE_MOCK;
});

import { pushDbResults, clearDbQueue } from "./db-mock";
import app from "../app";

beforeEach(() => {
  clearDbQueue();
  vi.clearAllMocks();
});

describe("GET /api/schools", () => {
  it("returns list of active schools", async () => {
    pushDbResults([mockSchool]);

    const res = await request(app).get("/api/schools");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: schoolId,
      name: "Test School",
      joinCode: "ABC123",
    });
  });

  it("returns empty array when no schools exist", async () => {
    pushDbResults([]);

    const res = await request(app).get("/api/schools");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("does not require authentication", async () => {
    pushDbResults([mockSchool]);

    const res = await request(app).get("/api/schools");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/schools", () => {
  it("creates a new school and returns 201 (admin only)", async () => {
    pushDbResults([]);
    const newSchool = { ...mockSchool, id: "new-school-id", name: "New School", joinCode: "XYZ789" };
    pushDbResults([newSchool]);

    const res = await request(app)
      .post("/api/schools")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New School" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "New School" });
    expect(res.body).toHaveProperty("joinCode");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/schools")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 403 when authenticated as a student", async () => {
    const res = await request(app)
      .post("/api/schools")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ name: "My School" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin access required/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/schools")
      .send({ name: "My School" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/schools/:id", () => {
  it("returns school details for the authenticated user's school", async () => {
    pushDbResults([mockSchool]);

    const res = await request(app)
      .get(`/api/schools/${schoolId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: schoolId,
      name: "Test School",
    });
  });

  it("returns 404 when school is not found", async () => {
    pushDbResults([]);

    const res = await request(app)
      .get("/api/schools/nonexistent-id")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("School not found");
  });

  it("returns 404 when school belongs to a different user", async () => {
    const otherSchool = { ...mockSchool, id: "other-school-id" };
    pushDbResults([otherSchool]);

    const res = await request(app)
      .get("/api/schools/other-school-id")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/schools/${schoolId}`);
    expect(res.status).toBe(401);
  });
});
