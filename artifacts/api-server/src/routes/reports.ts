import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reportsTable, postsTable, commentsTable, usersTable } from "@workspace/db";
import { CreateReportBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { targetType, targetId, reason } = parsed.data;
  const schoolId = req.user!.schoolId;

  const [reporterRow] = await db
    .select({ isSuspended: usersTable.isSuspended })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (reporterRow?.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended" });
    return;
  }

  // Validate the target exists and belongs to the reporter's school
  if (targetType === "post") {
    const [post] = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(and(eq(postsTable.id, targetId), eq(postsTable.schoolId, schoolId)));

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
  } else if (targetType === "comment") {
    const [commentRow] = await db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .innerJoin(postsTable, eq(commentsTable.postId, postsTable.id))
      .where(and(eq(commentsTable.id, targetId), eq(postsTable.schoolId, schoolId)));

    if (!commentRow) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      reporterId: req.user!.userId,
      targetType: targetType as "post" | "comment",
      targetId,
      reason: reason as "harmful" | "bullying" | "inappropriate" | "spam" | "other",
    })
    .returning();

  req.log.info({ reportId: report.id, targetType, targetId }, "Report submitted");

  res.status(201).json(report);
});

export default router;
