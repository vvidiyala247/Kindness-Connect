import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { mockComment, mockPost, mockUser, studentToken, postId, commentId } from "./fixtures";

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

describe("GET /api/posts/:id/comments", () => {
  it("returns list of comments for a post", async () => {
    pushDbResults([{ id: postId }], [mockComment]);

    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: commentId, postId });
  });

  it("returns empty array when post has no comments", async () => {
    pushDbResults([{ id: postId }], []);

    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 404 when post is not found", async () => {
    pushDbResults([]);

    const res = await request(app)
      .get("/api/posts/nonexistent/comments")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/posts/${postId}/comments`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/posts/:id/comments", () => {
  it("creates a comment and returns 201", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: "other-user-id", schoolId: mockPost.schoolId }],
      [mockComment],
      [{ nickname: "HappyBrave" }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "This is great!" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      content: "This is great!",
      authorNickname: "HappyBrave",
    });
  });

  it("creates a comment on own post without awarding kindness points", async () => {
    pushDbResults(
      [{ isSuspended: false }],
      [{ id: postId, authorId: mockUser.id, schoolId: mockPost.schoolId }],
      [mockComment],
      [{ nickname: "HappyBrave" }],
    );

    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Thanks everyone!" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: commentId });
  });

  it("returns 400 when content is empty", async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when content contains an image URL", async () => {
    pushDbResults([{ isSuspended: false }]);

    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Look at this https://example.com/photo.jpg" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/image content/i);
  });

  it("returns 403 when user is suspended", async () => {
    pushDbResults([{ isSuspended: true }]);

    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Hello!" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 404 when post is not found", async () => {
    pushDbResults([{ isSuspended: false }], []);

    const res = await request(app)
      .post("/api/posts/nonexistent/comments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "Hello!" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .send({ content: "Hello!" });
    expect(res.status).toBe(401);
  });
});

describe("comments — update/delete not implemented", () => {
  it("PUT /posts/:id/comments/:commentId returns 404", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ content: "edited" });
    expect(res.status).toBe(404);
  });

  it("DELETE /posts/:id/comments/:commentId returns 404", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
  });
});
