import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { studentToken, adminToken, postId, userId } from "./fixtures";

vi.mock("@workspace/db", async () => {
  const m = await import("./db-mock");
  return m.DB_MODULE_MOCK;
});

vi.mock("../lib/notifications", () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}));

import { pushDbResults, clearDbQueue } from "./db-mock";
import app from "../app";

const otherUserId = "other-user-uuid";

beforeEach(() => {
  clearDbQueue();
  vi.clearAllMocks();
});

describe("POST /api/posts/:id/gift", () => {
  it("gifts a post and returns 200 with giftsRemainingToday", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: false }],
      [{ giftsToday: 2 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("giftsRemainingToday");
    expect(res.body.giftsRemainingToday).toBe(2);
  });

  it("correctly computes giftsRemainingToday when no gifts sent yet today", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: false }],
      [{ giftsToday: 0 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.giftsRemainingToday).toBe(4);
  });

  it("returns 400 when user tries to gift their own post", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: userId, isHidden: false }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot gift your own post/i);
  });

  it("returns 403 when sender is suspended", async () => {
    pushDbResults([{ isSuspended: true }]);

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 404 when post does not exist", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [],
    );

    const res = await request(app)
      .post("/api/posts/nonexistent-post/gift")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 404 when post is hidden", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: true }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 400 when daily gift limit of 5 is reached", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: false }],
      [{ giftsToday: 5 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/daily gifts/i);
  });

  it("returns 400 when daily gift limit is exceeded (giftsToday > 5)", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: false }],
      [{ giftsToday: 7 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post(`/api/posts/${postId}/gift`);
    expect(res.status).toBe(401);
  });

  it("giftsRemainingToday is 0 when this is the last allowed gift (giftsToday was 4)", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: otherUserId, isHidden: false }],
      [{ giftsToday: 4 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/gift`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.giftsRemainingToday).toBe(0);
  });
});
