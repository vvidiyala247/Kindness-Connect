import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { studentToken } from "./fixtures";

vi.mock("@workspace/db", async () => {
  const m = await import("./db-mock");
  return m.DB_MODULE_MOCK;
});

import { clearDbQueue } from "./db-mock";
import app from "../app";

beforeEach(() => {
  clearDbQueue();
  vi.clearAllMocks();
});

describe("PUT /api/users/push-token", () => {
  it("registers a push token and returns 204", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("trims whitespace from the push token", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ token: "  ExponentPushToken[abc123]  " });

    expect(res.status).toBe(204);
  });

  it("returns 400 when token is missing from body", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/token/i);
  });

  it("returns 400 when token is an empty string", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ token: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/token/i);
  });

  it("returns 400 when token is whitespace only", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ token: "   " });

    expect(res.status).toBe(400);
  });

  it("returns 400 when token is not a string", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ token: 12345 });

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .send({ token: "ExponentPushToken[abc]" });

    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .put("/api/users/push-token")
      .set("Authorization", "Bearer invalid.token.here")
      .send({ token: "ExponentPushToken[abc]" });

    expect(res.status).toBe(401);
  });
});
