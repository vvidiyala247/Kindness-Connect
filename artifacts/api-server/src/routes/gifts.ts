import { Router, type IRouter } from "express";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db, giftsTable, kindnessScoresTable, postsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { sendPushNotification } from "../lib/notifications";

const router: IRouter = Router();

const DAILY_GIFT_LIMIT = 5;
const GIFT_POINTS = 5;

/**
 * POST /posts/:id/gift
 * Send a kindness gift (5 points) to the author of a post.
 * Limit: 5 gifts per sender per 24-hour window.
 */
router.post("/posts/:id/gift", requireAuth, async (req, res): Promise<void> => {
  const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = req.user!;

  // Check sender suspension
  const [sender] = await db
    .select({ isSuspended: usersTable.isSuspended })
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  if (sender?.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended" });
    return;
  }

  // Fetch post
  const [post] = await db
    .select({ id: postsTable.id, authorId: postsTable.authorId, isHidden: postsTable.isHidden })
    .from(postsTable)
    .where(and(eq(postsTable.id, postId), eq(postsTable.schoolId, user.schoolId)));

  if (!post || post.isHidden) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.authorId === user.userId) {
    res.status(400).json({ error: "You cannot gift your own post" });
    return;
  }

  // Enforce daily limit
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ giftsToday }] = await db
    .select({ giftsToday: count() })
    .from(giftsTable)
    .where(and(eq(giftsTable.senderId, user.userId), gte(giftsTable.createdAt, oneDayAgo)));

  if (giftsToday >= DAILY_GIFT_LIMIT) {
    res.status(400).json({
      error: `You have used all ${DAILY_GIFT_LIMIT} daily gifts — come back tomorrow! 🎁`,
    });
    return;
  }

  // Award gift in a transaction
  await db.transaction(async (tx) => {
    await tx.insert(giftsTable).values({
      senderId: user.userId,
      recipientId: post.authorId,
      postId: post.id,
      points: GIFT_POINTS,
    });
    await tx.insert(kindnessScoresTable).values({
      userId: post.authorId,
      eventType: "received_gift",
      points: GIFT_POINTS,
      sourceId: post.id,
    });
    await tx
      .update(usersTable)
      .set({ kindnessScore: sql`${usersTable.kindnessScore} + ${GIFT_POINTS}` })
      .where(eq(usersTable.id, post.authorId));
  });

  const giftsRemainingToday = DAILY_GIFT_LIMIT - giftsToday - 1;
  res.json({ giftsRemainingToday });

  // Fire-and-forget push notification to the recipient
  const [recipient] = await db
    .select({ pushToken: usersTable.pushToken, nickname: usersTable.nickname })
    .from(usersTable)
    .where(eq(usersTable.id, post.authorId));

  if (recipient?.pushToken) {
    void sendPushNotification([
      {
        to: recipient.pushToken,
        title: "You received a kindness gift! 🎁",
        body: `Someone appreciated your post and sent you ${GIFT_POINTS} kindness points. Keep spreading positivity, ${recipient.nickname}!`,
        sound: "default",
      },
    ]);
  }
});

export default router;
