import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockReport, mockUser, studentToken, adminToken, postId, reportId, schoolId, userId } from "./fixtures";

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

describe("PATCH /api/admin/reports/:id", () => {
  const resolvedReport = { ...mockReport, status: "reviewed" as const };

  it("resolves a report and returns the updated report", async () => {
    // Sequence: db.select(report+reporter) → tx.update(status) → db.select(final report)
    pushDbResults(
      [{ report: mockReport, reporterSchoolId: schoolId }],
      [],
      [resolvedReport],
    );

    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "reviewed", hideContent: false, suspendUser: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: reportId, status: "reviewed" });
  });

  it("hides post content when hideContent is true", async () => {
    // Sequence: db.select(report+reporter) → tx.update(status) → tx.update(hide post) → db.select(final)
    const actionedReport = { ...mockReport, status: "actioned" as const };
    pushDbResults(
      [{ report: mockReport, reporterSchoolId: schoolId }],
      [],
      [],
      [actionedReport],
    );

    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "actioned", hideContent: true, suspendUser: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: reportId });
  });

  it("suspends the content author when suspendUser is true", async () => {
    // Sequence: db.select(report+reporter) → tx.update(status) → tx.select(post author) → tx.update(suspend) → db.select(final)
    const actionedReport = { ...mockReport, status: "actioned" as const };
    pushDbResults(
      [{ report: mockReport, reporterSchoolId: schoolId }],
      [],
      [{ authorId: userId, schoolId }],
      [],
      [actionedReport],
    );

    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "actioned", hideContent: false, suspendUser: true });

    expect(res.status).toBe(200);
  });

  it("returns 400 when body is invalid", async () => {
    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid_status" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when report is not found", async () => {
    pushDbResults([]);

    const res = await request(app)
      .patch("/api/admin/reports/nonexistent-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "reviewed", hideContent: false, suspendUser: false });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Report not found");
  });

  it("returns 404 when report belongs to a different school", async () => {
    pushDbResults([{ report: mockReport, reporterSchoolId: "other-school-id" }]);

    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "reviewed", hideContent: false, suspendUser: false });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Report not found");
  });

  it("returns 403 for non-admin users", async () => {
    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "reviewed", hideContent: false, suspendUser: false });

    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .send({ status: "reviewed", hideContent: false, suspendUser: false });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/reports", () => {
  it("returns list of pending reports formatted without internal join fields", async () => {
    pushDbResults([{ reports: mockReport, users: { schoolId } }]);

    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: reportId,
      targetType: "post",
      reason: "spam",
      status: "pending",
    });
    expect(res.body[0]).not.toHaveProperty("users");
  });

  it("supports status filter via query param", async () => {
    pushDbResults([]);

    const res = await request(app)
      .get("/api/admin/reports?status=reviewed")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 403 for non-admin users", async () => {
    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/reports");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  it("returns list of users in admin's school", async () => {
    const safeUser = {
      id: mockUser.id,
      schoolId: mockUser.schoolId,
      nickname: mockUser.nickname,
      role: mockUser.role,
      kindnessScore: mockUser.kindnessScore,
      isSuspended: mockUser.isSuspended,
      createdAt: mockUser.createdAt,
    };
    pushDbResults([safeUser]);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: mockUser.id, role: "student" });
  });

  it("returned users do not include password hashes", async () => {
    const safeUser = {
      id: mockUser.id,
      schoolId: mockUser.schoolId,
      nickname: mockUser.nickname,
      role: mockUser.role,
      kindnessScore: mockUser.kindnessScore,
      isSuspended: mockUser.isSuspended,
      createdAt: mockUser.createdAt,
    };
    pushDbResults([safeUser]);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const user of res.body) {
      expect(user).not.toHaveProperty("passwordHash");
    }
  });

  it("returns 403 for non-admin users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});
