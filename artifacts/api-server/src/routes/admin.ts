import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, reportsTable, postsTable, commentsTable, usersTable } from "@workspace/db";
import { ListAdminReportsQueryParams, UpdateAdminReportBody, UpdateAdminUserBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function safeAdminUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role,
    kindnessScore: user.kindnessScore,
    warningCount: user.warningCount,
    isSuspended: user.isSuspended,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  };
}

router.get("/admin/reports", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListAdminReportsQueryParams.safeParse(req.query);
  const status = parsed.success ? (parsed.data.status ?? "pending") : "pending";

  const reports = await db
    .select()
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
    .where(
      and(
        eq(reportsTable.status, status as "pending" | "reviewed" | "actioned"),
        eq(usersTable.schoolId, req.user!.schoolId),
      ),
    )
    .orderBy(reportsTable.createdAt);

  const formatted = reports.map((r) => ({
    id: r.reports.id,
    reporterId: r.reports.reporterId,
    targetType: r.reports.targetType,
    targetId: r.reports.targetId,
    reason: r.reports.reason,
    status: r.reports.status,
    createdAt: r.reports.createdAt,
  }));

  res.json(formatted);
});

router.patch("/admin/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const adminSchoolId = req.user!.schoolId;

  const parsed = UpdateAdminReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, hideContent, suspendUser } = parsed.data;

  const [reportRow] = await db
    .select({ report: reportsTable, reporterSchoolId: usersTable.schoolId })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
    .where(eq(reportsTable.id, reportId));

  if (!reportRow) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  if (reportRow.reporterSchoolId !== adminSchoolId) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const report = reportRow.report;

  await db.transaction(async (tx) => {
    await tx
      .update(reportsTable)
      .set({ status: status as "pending" | "reviewed" | "actioned" })
      .where(eq(reportsTable.id, reportId));

    // Only resolve content and author when we need to act on them
    let authorId: string | null = null;

    if (hideContent || suspendUser) {
      if (report.targetType === "post") {
        const [post] = await tx
          .select({ authorId: postsTable.authorId, schoolId: postsTable.schoolId })
          .from(postsTable)
          .where(and(eq(postsTable.id, report.targetId), eq(postsTable.schoolId, adminSchoolId)));

        if (hideContent && post) {
          await tx
            .update(postsTable)
            .set({ isHidden: true })
            .where(eq(postsTable.id, report.targetId));
        }
        authorId = post?.authorId ?? null;
      } else if (report.targetType === "comment") {
        const [commentRow] = await tx
          .select({ comment: commentsTable })
          .from(commentsTable)
          .innerJoin(postsTable, eq(commentsTable.postId, postsTable.id))
          .where(and(eq(commentsTable.id, report.targetId), eq(postsTable.schoolId, adminSchoolId)));

        if (hideContent && commentRow) {
          await tx
            .update(commentsTable)
            .set({ isHidden: true })
            .where(eq(commentsTable.id, report.targetId));
        }
        authorId = commentRow?.comment.authorId ?? null;
      }
    }

    // Issue automatic warning when content is hidden (actioned)
    if (hideContent && authorId) {
      const [updatedAuthor] = await tx
        .update(usersTable)
        .set({ warningCount: sql`${usersTable.warningCount} + 1` })
        .where(eq(usersTable.id, authorId))
        .returning({ warningCount: usersTable.warningCount });

      // Auto-suspend after 3 warnings
      if (updatedAuthor && updatedAuthor.warningCount >= 3) {
        await tx
          .update(usersTable)
          .set({ isSuspended: true })
          .where(eq(usersTable.id, authorId));
        req.log.info({ authorId, warningCount: updatedAuthor.warningCount }, "User auto-suspended after 3 violations");
      } else {
        req.log.info({ authorId, warningCount: updatedAuthor?.warningCount }, "Warning issued to user");
      }
    }

    // Admin explicit suspension (overrides warning threshold)
    if (suspendUser && authorId) {
      await tx
        .update(usersTable)
        .set({ isSuspended: true })
        .where(eq(usersTable.id, authorId));
    }
  });

  req.log.info({ reportId, status, hideContent, suspendUser }, "Admin report updated");

  const [updatedReport] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, reportId));

  res.json(updatedReport);
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.schoolId, req.user!.schoolId))
    .orderBy(usersTable.createdAt);

  res.json(users.map(safeAdminUser));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const adminSchoolId = req.user!.schoolId;

  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action. Must be warn, suspend, or reinstate." });
    return;
  }

  const { action } = parsed.data;

  const [targetUser] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.schoolId, adminSchoolId)));

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (action === "warn") {
    const [updated] = await db
      .update(usersTable)
      .set({ warningCount: sql`${usersTable.warningCount} + 1` })
      .where(eq(usersTable.id, userId))
      .returning({ warningCount: usersTable.warningCount });

    if (updated && updated.warningCount >= 3) {
      await db
        .update(usersTable)
        .set({ isSuspended: true })
        .where(eq(usersTable.id, userId));
      req.log.info({ userId, warningCount: updated.warningCount }, "User auto-suspended by admin warn action");
    } else {
      req.log.info({ userId, warningCount: updated?.warningCount }, "Admin issued manual warning to user");
    }
  } else if (action === "suspend") {
    await db
      .update(usersTable)
      .set({ isSuspended: true })
      .where(eq(usersTable.id, userId));
    req.log.info({ userId }, "Admin manually suspended user");
  } else if (action === "reinstate") {
    await db
      .update(usersTable)
      .set({ isSuspended: false, warningCount: 0 })
      .where(eq(usersTable.id, userId));
    req.log.info({ userId }, "Admin reinstated user and reset warnings");
  }

  const [updatedUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!updatedUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(safeAdminUser(updatedUser));
});

export default router;
