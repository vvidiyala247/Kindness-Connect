import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

/**
 * PUT /users/push-token
 * Register or update the Expo push notification token for the current user.
 */
router.put("/users/push-token", requireAuth, async (req, res): Promise<void> => {
  const { token } = req.body as { token?: unknown };

  if (typeof token !== "string" || token.trim().length === 0) {
    res.status(400).json({ error: "token must be a non-empty string" });
    return;
  }

  await db
    .update(usersTable)
    .set({ pushToken: token.trim() })
    .where(eq(usersTable.id, req.user!.userId));

  res.status(204).send();
});

export default router;
