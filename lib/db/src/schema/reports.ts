import { pgTable, text, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const reportTargetTypeEnum = ["post", "comment"] as const;
export type ReportTargetType = (typeof reportTargetTypeEnum)[number];

export const reportStatusEnum = ["pending", "reviewed", "actioned"] as const;
export type ReportStatus = (typeof reportStatusEnum)[number];

export const reportReasonEnum = [
  "harmful",
  "bullying",
  "inappropriate",
  "spam",
  "other",
] as const;
export type ReportReason = (typeof reportReasonEnum)[number];

export const reportsTable = pgTable(
  "reports",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    targetType: text("target_type").$type<ReportTargetType>().notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").$type<ReportReason>().notNull(),
    status: text("status").$type<ReportStatus>().notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("reports_target_type_valid", sql`${table.targetType} IN ('post', 'comment')`),
    check("reports_reason_valid", sql`${table.reason} IN ('harmful', 'bullying', 'inappropriate', 'spam', 'other')`),
    check("reports_status_valid", sql`${table.status} IN ('pending', 'reviewed', 'actioned')`),
  ],
);

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  targetType: z.enum(["post", "comment"]),
  reason: z.enum(["harmful", "bullying", "inappropriate", "spam", "other"]),
});

export const selectReportSchema = createSelectSchema(reportsTable);

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
