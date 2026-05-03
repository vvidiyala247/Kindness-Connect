import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockSchool, mockUser, studentToken, userId } from "./fixtures";

vi.mock("@workspace/db", async () => {
  const m = await import("./db-mock");
  return m.DB_MODULE_MOCK;
});

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$mockedhash"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import { pushDbResults, clearDbQueue } from "./db-mock";
import app from "../app";

beforeEach(() => {
  clearDbQueue();
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 201 with token and user on success", async () => {
    pushDbResults([mockSchool], [], [mockUser]);

    const res = await request(app).post("/api/auth/register").send({
      joinCode: "ABC123",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      id: mockUser.id,
      nickname: mockUser.nickname,
      role: "student",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("returns 400 when body is invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      joinCode: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 when school join code is not found", async () => {
    pushDbResults([]);

    const res = await request(app).post("/api/auth/register").send({
      joinCode: "XXXXXX",
      password: "password123",
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/school not found/i);
  });

  it("returns 503 when nickname pool is exhausted", async () => {
    const manyNicknames = Array.from({ length: 10000 }, (_, i) => ({ nickname: `User${i}` }));
    pushDbResults([mockSchool], manyNicknames);

    const res = await request(app).post("/api/auth/register").send({
      joinCode: "ABC123",
      password: "password123",
    });

    expect(res.status).toBe(503);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 with token and user on valid credentials", async () => {
    pushDbResults([{ id: mockSchool.id }], [mockUser]);

    const res = await request(app).post("/api/auth/login").send({
      nickname: mockUser.nickname,
      joinCode: "ABC123",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      id: mockUser.id,
      nickname: mockUser.nickname,
    });
  });

  it("token is a valid JWT signed with the server secret", async () => {
    pushDbResults([{ id: mockSchool.id }], [mockUser]);

    const res = await request(app).post("/api/auth/login").send({
      nickname: mockUser.nickname,
      joinCode: "ABC123",
      password: "password123",
    });

    expect(res.status).toBe(200);
    const parts = (res.body.token as string).split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    expect(payload.userId).toBe(mockUser.id);
    expect(payload.role).toBe("student");
  });

  it("returns 400 when body is invalid", async () => {
    const res = await request(app).post("/api/auth/login").send({
      nickname: "HappyBrave",
    });

    expect(res.status).toBe(400);
  });

  it("returns 401 when school is not found", async () => {
    pushDbResults([]);

    const res = await request(app).post("/api/auth/login").send({
      nickname: "HappyBrave",
      joinCode: "XXXXXX",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 401 when user is not found", async () => {
    pushDbResults([{ id: mockSchool.id }], []);

    const res = await request(app).post("/api/auth/login").send({
      nickname: "UnknownUser",
      joinCode: "ABC123",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 when password is wrong", async () => {
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);

    pushDbResults([{ id: mockSchool.id }], [mockUser]);

    const res = await request(app).post("/api/auth/login").send({
      nickname: mockUser.nickname,
      joinCode: "ABC123",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user profile", async () => {
    pushDbResults([mockUser]);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: mockUser.id,
      nickname: mockUser.nickname,
      role: "student",
    });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing or invalid/i);
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it("returns 401 when Authorization header is malformed (no Bearer prefix)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", studentToken);

    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not found", async () => {
    pushDbResults([]);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/auth/me", () => {
  it("updates avatar and returns updated user", async () => {
    const updatedUser = { ...mockUser, avatar: "https://example.com/avatar.png" };
    pushDbResults([updatedUser]);

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ avatar: "https://example.com/avatar.png" });

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBe("https://example.com/avatar.png");
  });

  it("clears avatar when null is sent", async () => {
    const updatedUser = { ...mockUser, avatar: null };
    pushDbResults([updatedUser]);

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ avatar: null });

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).patch("/api/auth/me").send({ avatar: null });
    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not found in database", async () => {
    pushDbResults([]);

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ avatar: null });

    expect(res.status).toBe(404);
  });
});

describe("token expiry (no refresh endpoint)", () => {
  it("POST /auth/refresh returns 404 — refresh is not implemented; clients re-login on expiry", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(404);
  });

  it("expired token returns 401 on any protected route", async () => {
    const { default: jwt } = await import("jsonwebtoken");
    const expiredToken = jwt.sign(
      { userId, schoolId: "school-uuid-1", nickname: "HappyBrave", role: "student", exp: Math.floor(Date.now() / 1000) - 3600 },
      "test-secret-key-for-vitest",
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });
});
