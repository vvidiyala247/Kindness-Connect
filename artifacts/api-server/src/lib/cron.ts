import cron from "node-cron";
import { and, count, eq, gte, isNotNull } from "drizzle-orm";
import { db, kindnessScoresTable, usersTable } from "@workspace/db";
import { sendPushNotification } from "./notifications";
import { logger } from "./logger";

/**
 * Start all background cron jobs.
 * Call once after the HTTP server starts listening.
 */
export function startCronJobs(): void {
  // Every Sunday at 8 PM UTC — weekly kindness summary
  cron.schedule("0 20 * * 0", () => {
    void sendWeeklyKindnessSummary();
  });

  logger.info("Cron jobs started");
}

async function sendWeeklyKindnessSummary(): Promise<void> {
  logger.info("Running weekly kindness summary notifications");

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const users = await db
      .select({
        id: usersTable.id,
        nickname: usersTable.nickname,
        pushToken: usersTable.pushToken,
      })
      .from(usersTable)
      .where(
        and(eq(usersTable.isSuspended, false), isNotNull(usersTable.pushToken)),
      );

    const messages: { to: string; title: string; body: string; sound: "default" }[] = [];

    for (const user of users) {
      if (!user.pushToken) continue;

      const [{ acts }] = await db
        .select({ acts: count() })
        .from(kindnessScoresTable)
        .where(
          and(
            eq(kindnessScoresTable.userId, user.id),
            eq(kindnessScoresTable.eventType, "post_kindness_act"),
            gte(kindnessScoresTable.createdAt, oneWeekAgo),
          ),
        );

      if (acts > 0) {
        messages.push({
          to: user.pushToken,
          title: "Your weekly kindness report 💛",
          body:
            acts === 1
              ? `This week you shared 1 act of kindness, ${user.nickname}. One kind act can change someone's whole day!`
              : `This week you shared ${acts} acts of kindness, ${user.nickname}! Your school is a brighter place because of you.`,
          sound: "default",
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotification(messages);
      logger.info({ count: messages.length }, "Weekly kindness summaries sent");
    } else {
      logger.info("No weekly summaries to send");
    }
  } catch (err) {
    logger.error({ err }, "Weekly kindness summary cron failed");
  }
}
