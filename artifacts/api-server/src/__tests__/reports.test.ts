import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockReport, mockUser, studentToken, postId, commentId } from "./fixtures";

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

describe("POST /api/reports", () => {
  it("creates a post report and returns 201", async () => {
    pushDbResults([{ isSuspended: false }], [{ id: postId }], [mockReport]);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "post", targetId: postId, reason: "spam" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      targetType: "post",
      targetId: postId,
      reason: "spam",
      status: "pending",
    });
  });

  it("creates a comment report and returns 201", async () => {
    const commentReport = { ...mockReport, targetType: "comment" as const, targetId: commentId };
    pushDbResults([{ isSuspended: false }], [{ id: commentId }], [commentReport]);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "comment", targetId: commentId, reason: "bullying" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      targetType: "comment",
      targetId: commentId,
    });
  });

  it("supports all valid reason values", async () => {
    const reasons = ["harmful", "bullying", "inappropriate", "spam", "other"] as const;
    for (const reason of reasons) {
      clearDbQueue();
      const report = { ...mockReport, reason };
      pushDbResults([{ isSuspended: false }], [{ id: postId }], [report]);

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ targetType: "post", targetId: postId, reason });

      expect(res.status).toBe(201);
      expect(res.body.reason).toBe(reason);
    }
  });

  it("returns 400 when targetId is missing", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "post" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when reason is invalid", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "post", targetId: postId, reason: "notavalidreason" });

    expect(res.status).toBe(400);
  });

  it("returns 403 when reporter is suspended", async () => {
    pushDbResults([{ isSuspended: true }]);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "post", targetId: postId, reason: "spam" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 404 when target post is not found", async () => {
    pushDbResults([{ isSuspended: false }], []);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "post", targetId: "nonexistent-post-id", reason: "spam" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 404 when target comment is not found", async () => {
    pushDbResults([{ isSuspended: false }], []);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ targetType: "comment", targetId: "nonexistent-comment-id", reason: "bullying" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Comment not found");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", targetId: postId, reason: "spam" });

    expect(res.status).toBe(401);
  });
});
