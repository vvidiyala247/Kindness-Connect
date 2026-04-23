import { Router, type IRouter } from "express";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, commentsTable, postsTable, usersTable, kindnessScoresTable } from "@workspace/db";
import { CreateCommentBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const IMAGE_PATTERN = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))|data:image\//i;

router.get("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const schoolId = req.user!.schoolId;

  const [post] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.id, postId), eq(postsTable.schoolId, schoolId)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = await db
    .select({
      id: commentsTable.id,
      postId: commentsTable.postId,
      authorId: commentsTable.authorId,
      authorNickname: usersTable.nickname,
      content: commentsTable.content,
      isHidden: commentsTable.isHidden,
      createdAt: commentsTable.createdAt,
    })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
    .where(and(eq(commentsTable.postId, postId), eq(commentsTable.isHidden, false)))
    .orderBy(asc(commentsTable.createdAt));

  res.json(comments);
});

router.post("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = req.user!;

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content } = parsed.data;

  if (IMAGE_PATTERN.test(content)) {
    res.status(400).json({ error: "Image content is not allowed in comments" });
    return;
  }

  const [isSuspended] = await db
    .select({ isSuspended: usersTable.isSuspended })
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  if (isSuspended?.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended" });
    return;
  }

  const [post] = await db
    .select({ id: postsTable.id, authorId: postsTable.authorId, schoolId: postsTable.schoolId })
    .from(postsTable)
    .where(and(eq(postsTable.id, postId), eq(postsTable.schoolId, user.schoolId), eq(postsTable.isHidden, false)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ postId, authorId: user.userId, content })
    .returning();

  if (post.authorId !== user.userId) {
    await db.transaction(async (tx) => {
      await tx.insert(kindnessScoresTable).values({
        userId: post.authorId,
        eventType: "received_comment",
        points: 2,
        sourceId: comment.id,
      });
      await tx
        .update(usersTable)
        .set({ kindnessScore: sql`${usersTable.kindnessScore} + 2` })
        .where(eq(usersTable.id, post.authorId));
    });
  }

  const [author] = await db
    .select({ nickname: usersTable.nickname })
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  req.log.info({ commentId: comment.id, postId }, "Comment created");

  res.status(201).json({
    ...comment,
    authorNickname: author?.nickname ?? user.nickname,
  });
});

export default router;
