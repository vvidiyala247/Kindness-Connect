import { Router, type IRouter } from "express";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db, postsTable, usersTable, kindnessScoresTable } from "@workspace/db";
import { CreatePostBody, ListPostsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const IMAGE_PATTERN = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))|data:image\//i;

function hasImageContent(text: string): boolean {
  return IMAGE_PATTERN.test(text);
}

router.get("/posts", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const schoolId = req.user!.schoolId;

  const conditions = [
    eq(postsTable.schoolId, schoolId),
    eq(postsTable.isHidden, false),
  ];
  if (type) {
    conditions.push(eq(postsTable.type, type as "support" | "kindness_act"));
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(postsTable)
    .where(and(...conditions));

  const posts = await db
    .select({
      id: postsTable.id,
      schoolId: postsTable.schoolId,
      authorId: postsTable.authorId,
      authorNickname: usersTable.nickname,
      type: postsTable.type,
      content: postsTable.content,
      isHidden: postsTable.isHidden,
      likeCount: postsTable.likeCount,
      createdAt: postsTable.createdAt,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ posts, total, page, limit });
});

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, content } = parsed.data;

  if (hasImageContent(content)) {
    res.status(400).json({ error: "Image content is not allowed in posts" });
    return;
  }

  const user = req.user!;

  const [isSuspended] = await db
    .select({ isSuspended: usersTable.isSuspended })
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  if (isSuspended?.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended" });
    return;
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      schoolId: user.schoolId,
      authorId: user.userId,
      type: type as "support" | "kindness_act",
      content,
    })
    .returning();

  const [author] = await db
    .select({ nickname: usersTable.nickname })
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  if (type === "kindness_act") {
    await db.transaction(async (tx) => {
      await tx.insert(kindnessScoresTable).values({
        userId: user.userId,
        eventType: "post_kindness_act",
        points: 5,
        sourceId: post.id,
      });
      await tx
        .update(usersTable)
        .set({ kindnessScore: sql`${usersTable.kindnessScore} + 5` })
        .where(eq(usersTable.id, user.userId));
    });
  }

  req.log.info({ postId: post.id, type }, "Post created");

  res.status(201).json({
    ...post,
    authorNickname: author?.nickname ?? user.nickname,
  });
});

router.get("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const schoolId = req.user!.schoolId;

  const [post] = await db
    .select({
      id: postsTable.id,
      schoolId: postsTable.schoolId,
      authorId: postsTable.authorId,
      authorNickname: usersTable.nickname,
      type: postsTable.type,
      content: postsTable.content,
      isHidden: postsTable.isHidden,
      likeCount: postsTable.likeCount,
      createdAt: postsTable.createdAt,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(and(eq(postsTable.id, id), eq(postsTable.schoolId, schoolId)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(post);
});

router.post("/posts/:id/like", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const liker = req.user!;

  const [post] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, id), eq(postsTable.schoolId, liker.schoolId)));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.isHidden) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [updatedPost] = await db.transaction(async (tx) => {
    const [p] = await tx
      .update(postsTable)
      .set({ likeCount: sql`${postsTable.likeCount} + 1` })
      .where(eq(postsTable.id, id))
      .returning();

    if (post.authorId !== liker.userId) {
      await tx.insert(kindnessScoresTable).values({
        userId: post.authorId,
        eventType: "received_like",
        points: 1,
        sourceId: id,
      });
      await tx
        .update(usersTable)
        .set({ kindnessScore: sql`${usersTable.kindnessScore} + 1` })
        .where(eq(usersTable.id, post.authorId));
    }

    return [p];
  });

  const [author] = await db
    .select({ nickname: usersTable.nickname })
    .from(usersTable)
    .where(eq(usersTable.id, post.authorId));

  res.json({ ...updatedPost, authorNickname: author?.nickname ?? "" });
});

export default router;
