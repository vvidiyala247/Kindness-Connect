interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

/**
 * Send one or more push notifications via the Expo Push API.
 * Always fire-and-forget — never throws.
 */
export async function sendPushNotification(
  messages: ExpoPushMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  const payload = messages.length === 1 ? messages[0] : messages;
  try {
    await fetch("https://exp.host/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-fatal: network issues or invalid tokens are silently ignored
  }
}
