import { pgTable, text, integer, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scoreEventTypeEnum = [
  "post_kindness_act",
  "received_like",
  "received_comment",
] as const;
export type ScoreEventType = (typeof scoreEventTypeEnum)[number];

export const kindnessScoreEventsTable = pgTable(
  "kindness_score_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").$type<ScoreEventType>().notNull(),
    points: integer("points").notNull(),
    sourceId: text("source_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "kindness_score_events_event_type_valid",
      sql`${table.eventType} IN ('post_kindness_act', 'received_like', 'received_comment')`,
    ),
    check("kindness_score_events_points_positive", sql`${table.points} > 0`),
  ],
);

export const insertKindnessScoreEventSchema = createInsertSchema(kindnessScoreEventsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  eventType: z.enum(["post_kindness_act", "received_like", "received_comment"]),
  points: z.number().int().positive(),
});

export const selectKindnessScoreEventSchema = createSelectSchema(kindnessScoreEventsTable);

export type InsertKindnessScoreEvent = z.infer<typeof insertKindnessScoreEventSchema>;
export type KindnessScoreEvent = typeof kindnessScoreEventsTable.$inferSelect;
