import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, schoolsTable } from "@workspace/db";
import { CreateSchoolBody } from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateJoinCode();
    const [existing] = await db
      .select({ id: schoolsTable.id })
      .from(schoolsTable)
      .where(eq(schoolsTable.joinCode, code));
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique join code after 20 attempts");
}

router.post("/schools", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const joinCode = await generateUniqueJoinCode();

  const [school] = await db
    .insert(schoolsTable)
    .values({ name: parsed.data.name, joinCode })
    .returning();

  req.log.info({ schoolId: school.id, joinCode: school.joinCode }, "School created");

  res.status(201).json(school);
});

router.get("/schools/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [school] = await db
    .select()
    .from(schoolsTable)
    .where(eq(schoolsTable.id, id));

  if (!school) {
    res.status(404).json({ error: "School not found" });
    return;
  }

  if (req.user!.role !== "admin" && req.user!.schoolId !== school.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(school);
});

export default router;
