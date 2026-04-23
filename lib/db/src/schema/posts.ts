import { pgTable, text, boolean, integer, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";
import { usersTable } from "./users";

export const postTypeEnum = ["support", "kindness_act"] as const;
export type PostType = (typeof postTypeEnum)[number];

export const postsTable = pgTable(
  "posts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<PostType>().notNull(),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("posts_type_valid", sql`${table.type} IN ('support', 'kindness_act')`),
    check("posts_content_length", sql`char_length(${table.content}) BETWEEN 1 AND 500`),
    check("posts_like_count_non_negative", sql`${table.likeCount} >= 0`),
  ],
);

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  isHidden: true,
  likeCount: true,
}).extend({
  type: z.enum(["support", "kindness_act"]),
  content: z.string().min(1).max(500),
});

export const selectPostSchema = createSelectSchema(postsTable);

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
