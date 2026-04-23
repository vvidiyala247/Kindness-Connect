import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, schoolsTable, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken } from "../lib/jwt";
import { generateUniqueNickname } from "../lib/nicknames";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

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
  const nickname = await generateUniqueNickname(existingNicknames);

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      schoolId: school.id,
      nickname,
      passwordHash,
      role: "student",
    })
    .returning();

  const token = signToken({
    userId: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role as "student" | "admin",
  });

  req.log.info({ userId: user.id, schoolId: school.id }, "User registered");

  res.status(201).json({
    token,
    user: {
      id: user.id,
      schoolId: user.schoolId,
      nickname: user.nickname,
      role: user.role,
      kindnessScore: user.kindnessScore,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nickname, schoolId, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.nickname, nickname), eq(usersTable.schoolId, schoolId)));

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

  res.json({
    token,
    user: {
      id: user.id,
      schoolId: user.schoolId,
      nickname: user.nickname,
      role: user.role,
      kindnessScore: user.kindnessScore,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    },
  });
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

  res.json({
    id: user.id,
    schoolId: user.schoolId,
    nickname: user.nickname,
    role: user.role,
    kindnessScore: user.kindnessScore,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt,
  });
});

export default router;
