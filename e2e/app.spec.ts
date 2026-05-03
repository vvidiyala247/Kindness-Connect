import { test, expect, request } from "@playwright/test";

const API_URL = process.env.TEST_API_URL || "http://localhost:8080";
const JOIN_CODE = "TESTXX";
const TEST_PASSWORD = "TestPass123!";

interface AuthResult {
  token: string;
  user: { id: string; nickname: string; schoolId: string; role: string };
}

async function registerTestUser(): Promise<AuthResult> {
  const ctx = await request.newContext({ baseURL: API_URL });
  const res = await ctx.post("/api/auth/register", {
    data: { joinCode: JOIN_CODE, password: TEST_PASSWORD },
  });
  const text = await res.text();
  await ctx.dispose();
  if (!res.ok()) throw new Error(`Register failed: ${text}`);
  return JSON.parse(text);
}

async function apiLogin(nickname: string): Promise<AuthResult> {
  const ctx = await request.newContext({ baseURL: API_URL });
  const res = await ctx.post("/api/auth/login", {
    data: { nickname, joinCode: JOIN_CODE, password: TEST_PASSWORD },
  });
  const text = await res.text();
  await ctx.dispose();
  if (!res.ok()) throw new Error(`Login failed: ${text}`);
  return JSON.parse(text);
}

async function loginViaUI(
  page: import("@playwright/test").Page,
  nickname: string
): Promise<void> {
  await page.goto("/");
  await expect(page.getByPlaceholder("BraveOtter")).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("BraveOtter").fill(nickname);
  await page.getByPlaceholder("ABC123").fill(JOIN_CODE);
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.fill(TEST_PASSWORD);
  const loginBtn = page.getByText("Sign In").last();
  await loginBtn.click({ force: true });
  await expect(page.getByText("Feed").first()).toBeVisible({ timeout: 20_000 });
}

test.describe("KindnessConnect — full user journey E2E", () => {
  let nickname: string;
  let token: string;
  let posterToken: string;

  test.beforeAll(async () => {
    const auth = await registerTestUser();
    nickname = auth.user.nickname;
    token = auth.token;
    const posterAuth = await registerTestUser();
    posterToken = posterAuth.token;
  });

  test("login via UI lands on the Feed screen", async ({ page }) => {
    await loginViaUI(page, nickname);
    await expect(page.getByText("Feed").first()).toBeVisible();
  });

  test("feed screen displays posts fetched from the API", async ({ page }) => {
    const ctx = await request.newContext({ baseURL: API_URL });
    const content = `E2E feed test ${Date.now()}`;
    await ctx.post("/api/posts", {
      headers: { Authorization: `Bearer ${token}` },
      data: { type: "kindness_act", content },
    });
    await ctx.dispose();

    await loginViaUI(page, nickname);
    await expect(page.getByText(content).first()).toBeVisible({ timeout: 15_000 });
  });

  test("register new user — API returns token and auto-assigned nickname", async () => {
    const auth = await registerTestUser();
    expect(auth.token).toBeTruthy();
    expect(typeof auth.user.nickname).toBe("string");
    expect(auth.user.nickname.length).toBeGreaterThan(0);
    expect(auth.user.schoolId).toBeTruthy();
  });

  test("create a new post via the new-post screen", async ({ page }) => {
    await loginViaUI(page, nickname);
    const postContent = `E2E kindness ${Date.now()}`;

    await page.goto("/new-post");

    await expect(
      page.getByPlaceholder(/Share a moment of kindness|Share what you/)
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByPlaceholder(/Share a moment of kindness|Share what you/)
      .fill(postContent);
    await page.getByText("Post Anonymously").first().click({ force: true });

    await expect(page.getByText("Feed").first()).toBeVisible({ timeout: 20_000 });
  });

  test("post detail screen shows post content and accepts comments", async ({ page }) => {
    const postContent = `E2E detail post ${Date.now()}`;
    const ctx = await request.newContext({ baseURL: API_URL });
    const postRes = await ctx.post("/api/posts", {
      headers: { Authorization: `Bearer ${token}` },
      data: { type: "kindness_act", content: postContent },
    });
    const post = await postRes.json();
    await ctx.dispose();

    await loginViaUI(page, nickname);
    await page.getByText(postContent).first().click();

    const commentInput = page.getByPlaceholder("Add a kind comment...");
    await expect(commentInput).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(postContent).last()).toBeVisible({ timeout: 10_000 });

    const commentText = `E2E comment ${Date.now()}`;
    await commentInput.fill(commentText);
    await page.getByLabel("Send comment").click({ force: true });

    const verifyCtx = await request.newContext({ baseURL: API_URL });
    await expect(async () => {
      const commentsRes = await verifyCtx.get(`/api/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const comments = await commentsRes.json();
      const list = Array.isArray(comments) ? comments : comments.comments ?? [];
      const found = list.find((c: { content: string }) => c.content === commentText);
      expect(found).toBeTruthy();
    }).toPass({ timeout: 15_000 });
    await verifyCtx.dispose();
  });

  test("register new user via UI — shows nickname and enters community", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("BraveOtter")).toBeVisible({ timeout: 30_000 });
    await page.getByText("Join with a school code").click({ force: true });

    await expect(page.getByText("Join your school").first()).toBeVisible({ timeout: 15_000 });

    const schoolPickerBtn = page.getByText("Tap to choose your school").first();
    await schoolPickerBtn.click({ force: true });
    const schoolDialog = page.getByRole("dialog");
    await expect(schoolDialog.getByText("Test Academy").first()).toBeVisible({ timeout: 10_000 });
    await schoolDialog.getByText("Test Academy").first().click();

    await page.getByPlaceholder("Min 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat your password").fill(TEST_PASSWORD);

    await page.getByText("Create Account").last().click({ force: true });

    await expect(page.getByText("You're in!").first()).toBeVisible({ timeout: 20_000 });
    await page.getByText("Enter the Community").first().click({ force: true });
    await expect(page.getByText("Feed").first()).toBeVisible({ timeout: 20_000 });
  });

  test("report modal — flag button opens modal, select reason, submit", async ({ page }) => {
    const postContent = `E2E reportable post ${Date.now()}`;
    const ctx = await request.newContext({ baseURL: API_URL });
    await ctx.post("/api/posts", {
      headers: { Authorization: `Bearer ${posterToken}` },
      data: { type: "kindness_act", content: postContent },
    });
    await ctx.dispose();

    await loginViaUI(page, nickname);
    await expect(page.getByText(postContent).first()).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Report post").first().click({ force: true });
    await expect(page.getByText("Report content").first()).toBeVisible({ timeout: 10_000 });

    const spamOption = page.getByText("Spam").first();
    await spamOption.scrollIntoViewIfNeeded();
    await spamOption.click({ force: true });

    const submitBtn = page.getByText("Submit Report").first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    await expect(page.getByText("Report submitted").first()).toBeVisible({ timeout: 10_000 });
  });
});
