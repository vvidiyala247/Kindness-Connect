import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, schoolsTable, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody, UpdateMeBody } from "@workspace/api-zod";
import { signToken } from "../lib/jwt";
import { generateUniqueNickname } from "../lib/nicknames";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role,
    kindnessScore: user.kindnessScore,
    isSuspended: user.isSuspended,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { joinCode, password } = parsed.data;

  const [school] = await db
    .select()
    .from(schoolsTable)
    .where(and(eq(schoolsTable.joinCode, joinCode.toUpperCase()), eq(schoolsTable.isActive, true)));

  if (!school) {
    res.status(404).json({ error: "School not found. Check your join code." });
    return;
  }

  const existingUsers = await db
    .select({ nickname: usersTable.nickname })
    .from(usersTable)
    .where(eq(usersTable.schoolId, school.id));

  const existingNicknames = new Set(existingUsers.map((u) => u.nickname));
  const nickname = generateUniqueNickname(existingNicknames);
  if (nickname === null) {
    res.status(503).json({ error: "Nickname pool exhausted for this school. Please contact your administrator." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user: typeof usersTable.$inferSelect;
  for (let attempt = 0; attempt < 3; attempt++) {
    const nicknameToTry = attempt === 0 ? nickname : (generateUniqueNickname(existingNicknames) ?? nickname);
    try {
      const rows = await db
        .insert(usersTable)
        .values({
          schoolId: school.id,
          nickname: nicknameToTry,
          passwordHash,
          role: "student",
        })
        .returning();
      user = rows[0];
      break;
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "23505";
      if (isUniqueViolation && attempt < 2) {
        existingNicknames.add(nicknameToTry);
        continue;
      }
      throw err;
    }
  }
  if (!user!) {
    res.status(503).json({ error: "Could not assign a unique nickname. Please try again." });
    return;
  }

  const token = signToken({
    userId: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role as "student" | "admin",
  });

  req.log.info({ userId: user.id, schoolId: school.id }, "User registered");
  res.status(201).json({ token, user: safeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nickname, joinCode, password } = parsed.data;

  const [school] = await db
    .select({ id: schoolsTable.id })
    .from(schoolsTable)
    .where(and(eq(schoolsTable.joinCode, joinCode.toUpperCase()), eq(schoolsTable.isActive, true)));

  if (!school) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.nickname, nickname), eq(usersTable.schoolId, school.id)));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({
    userId: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role as "student" | "admin",
  });

  req.log.info({ userId: user.id }, "User logged in");
  res.json({ token, user: safeUser(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(safeUser(user));
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ avatar: parsed.data.avatar })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  req.log.info({ userId: user.id }, "User updated avatar");
  res.json(safeUser(user));
});

export default router;
