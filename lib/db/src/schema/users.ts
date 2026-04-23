import { pgTable, text, boolean, integer, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const userRoleEnum = ["student", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("student"),
    kindnessScore: integer("kindness_score").notNull().default(0),
    isSuspended: boolean("is_suspended").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_school_nickname_unique").on(table.schoolId, table.nickname),
    check("users_role_valid", sql`${table.role} IN ('student', 'admin')`),
    check("users_kindness_score_non_negative", sql`${table.kindnessScore} >= 0`),
    check(
      "users_nickname_format",
      sql`${table.nickname} ~ '^[A-Z][a-z]+[A-Z][a-z]+$'`,
    ),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  kindnessScore: true,
  isSuspended: true,
});

export const selectUserSchema = createSelectSchema(usersTable).omit({
  passwordHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;
