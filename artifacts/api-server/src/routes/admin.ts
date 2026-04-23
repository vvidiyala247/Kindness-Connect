import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reportsTable, postsTable, commentsTable, usersTable } from "@workspace/db";
import { ListAdminReportsQueryParams, UpdateAdminReportBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

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

  const parsed = UpdateAdminReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, hideContent, suspendUser } = parsed.data;

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, reportId));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(reportsTable)
      .set({ status: status as "pending" | "reviewed" | "actioned" })
      .where(eq(reportsTable.id, reportId));

    if (hideContent) {
      if (report.targetType === "post") {
        await tx
          .update(postsTable)
          .set({ isHidden: true })
          .where(eq(postsTable.id, report.targetId));
      } else if (report.targetType === "comment") {
        await tx
          .update(commentsTable)
          .set({ isHidden: true })
          .where(eq(commentsTable.id, report.targetId));
      }
    }

    if (suspendUser) {
      let authorId: string | null = null;
      if (report.targetType === "post") {
        const [post] = await tx
          .select({ authorId: postsTable.authorId })
          .from(postsTable)
          .where(eq(postsTable.id, report.targetId));
        authorId = post?.authorId ?? null;
      } else if (report.targetType === "comment") {
        const [comment] = await tx
          .select({ authorId: commentsTable.authorId })
          .from(commentsTable)
          .where(eq(commentsTable.id, report.targetId));
        authorId = comment?.authorId ?? null;
      }

      if (authorId) {
        await tx
          .update(usersTable)
          .set({ isSuspended: true })
          .where(eq(usersTable.id, authorId));
      }
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
    .select({
      id: usersTable.id,
      schoolId: usersTable.schoolId,
      nickname: usersTable.nickname,
      role: usersTable.role,
      kindnessScore: usersTable.kindnessScore,
      isSuspended: usersTable.isSuspended,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.schoolId, req.user!.schoolId))
    .orderBy(usersTable.createdAt);

  res.json(users);
});

export default router;
