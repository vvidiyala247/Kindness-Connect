import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
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
