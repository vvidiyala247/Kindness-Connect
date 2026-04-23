import { pgTable, text, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const commentsTable = pgTable(
  "comments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("comments_content_length", sql`char_length(${table.content}) BETWEEN 1 AND 300`),
  ],
);

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
  isHidden: true,
}).extend({
  content: z.string().min(1).max(300),
});

export const selectCommentSchema = createSelectSchema(commentsTable);

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
