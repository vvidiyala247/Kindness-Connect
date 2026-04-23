import { pgTable, text, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolsTable = pgTable(
  "schools",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("schools_join_code_format", sql`${table.joinCode} ~ '^[A-Z0-9]{6}$'`),
  ],
);

export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({
  id: true,
  createdAt: true,
});

export const selectSchoolSchema = createSelectSchema(schoolsTable);

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schoolsTable.$inferSelect;
