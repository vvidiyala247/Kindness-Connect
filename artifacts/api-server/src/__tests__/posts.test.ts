import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockPost, mockUser, studentToken, adminToken, postId, userId, schoolId } from "./fixtures";

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

describe("GET /api/posts", () => {
  it("returns paginated posts list", async () => {
    pushDbResults([{ total: 1 }], [mockPost]);

    const res = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0]).toMatchObject({ id: postId });
  });

  it("supports type filter via query param", async () => {
    pushDbResults([{ total: 0 }], []);

    const res = await request(app)
      .get("/api/posts?type=support")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(0);
  });

  it("supports pagination params", async () => {
    pushDbResults([{ total: 0 }], []);

    const res = await request(app)
      .get("/api/posts?page=2&limit=5")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(5);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/posts", () => {
  it("creates a support post and returns 201", async () => {
    const supportPost = { ...mockPost, type: "support" as const };
    pushDbResults([{ isSuspended: false }], [supportPost], [{ nickname: "HappyBrave" }]);

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ type: "support", content: "I need some help today" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      type: "support",
      authorNickname: "HappyBrave",
    });
  });

  it("creates a kindness_act post and awards points", async () => {
    pushDbResults([{ isSuspended: false }], [mockPost], [{ nickname: "HappyBrave" }]);

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ type: "kindness_act", content: "I helped someone today" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      type: "kindness_act",
      commentCount: 0,
    });
  });

  it("returns 400 when body is invalid", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ type: "invalid_type", content: "Hello" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when content contains an image URL", async () => {
    pushDbResults([{ isSuspended: false }]);

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        type: "support",
        content: "Check this out https://example.com/image.png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/image content/i);
  });

  it("returns 403 when user is suspended", async () => {
    pushDbResults([{ isSuspended: true }]);

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ type: "support", content: "Can I get help?" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ type: "support", content: "Hello" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/posts/:id", () => {
  it("returns a single post", async () => {
    pushDbResults([mockPost]);

    const res = await request(app)
      .get(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: postId });
  });

  it("returns 404 when post is not found", async () => {
    pushDbResults([]);

    const res = await request(app)
      .get("/api/posts/nonexistent-id")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/posts/:id/like", () => {
  it("likes a post and returns the updated post", async () => {
    const likedPost = { ...mockPost, likeCount: 1 };
    pushDbResults(
      [{ isSuspended: false }],
      [mockPost],
      [likedPost],
      [{ nickname: "HappyBrave" }],
      [{ commentCount: 0 }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.likeCount).toBe(1);
  });

  it("returns 404 when post is not found", async () => {
    pushDbResults([{ isSuspended: false }], []);

    const res = await request(app)
      .post("/api/posts/nonexistent/like")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 when liker is suspended", async () => {
    pushDbResults([{ isSuspended: true }]);

    const res = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post(`/api/posts/${postId}/like`);
    expect(res.status).toBe(401);
  });
});

describe("posts — update/delete not implemented", () => {
  it("PUT /posts/:id returns 404", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "edited" });
    expect(res.status).toBe(404);
  });

  it("DELETE /posts/:id returns 404", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
  });
});
