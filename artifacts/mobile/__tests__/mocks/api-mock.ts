type RouteHandler = (url: string, options: RequestInit) => Promise<MockResponse> | MockResponse;

interface MockResponse {
  status: number;
  data: unknown;
}

function makeFetchResponse(data: unknown, status = 200) {
  const body = data !== undefined ? JSON.stringify(data) : null;
  const headersMap: Record<string, string> = {
    "content-type": "application/json",
  };
  if (body) headersMap["content-length"] = String(body.length);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : status === 401 ? "Unauthorized" : "Error",
    headers: {
      get: (name: string) => headersMap[name.toLowerCase()] ?? null,
      has: (name: string) => name.toLowerCase() in headersMap,
    },
    body: body,
    text: () => Promise.resolve(body ?? ""),
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob([body ?? ""])),
    url: "",
    type: "default",
    clone() {
      return this;
    },
  };
}

function matchRoute(url: string, method: string, routes: Map<string, RouteHandler>): RouteHandler | null {
  const urlPath = url.replace("http://localhost", "");

  for (const [pattern, handler] of routes) {
    const [patternMethod, patternPath] = pattern.split(" ");
    if (patternMethod !== method) continue;

    const regexStr = patternPath
      .replace(/:[^/]+/g, "[^/]+")
      .replace(/\*/g, "[^/]+");
    const regex = new RegExp(`^${regexStr}(\\?.*)?$`);
    if (regex.test(urlPath)) {
      return handler;
    }
  }
  return null;
}

export class ApiMock {
  private overrides = new Map<string, RouteHandler>();
  public lastRequest: { url: string; method: string; body: unknown } | null = null;

  private defaultRoutes = new Map<string, RouteHandler>([
    [
      "GET /api/auth/me",
      () => ({
        status: 200,
        data: {
          id: "user-1",
          nickname: "BraveOtter",
          schoolId: "school-1",
          role: "student",
          kindnessScore: 10,
        },
      }),
    ],
    [
      "POST /api/auth/login",
      async (url, options) => {
        const body = JSON.parse((options.body as string) ?? "{}");
        if (body.password === "wrongpass" || body.password === "badpassword") {
          return { status: 401, data: { error: "Invalid credentials" } };
        }
        return {
          status: 200,
          data: {
            token: "test-token-123",
            user: { id: "user-1", nickname: "BraveOtter", schoolId: "school-1", role: "student", kindnessScore: 10 },
          },
        };
      },
    ],
    [
      "POST /api/auth/register",
      () => ({
        status: 200,
        data: {
          token: "reg-token-123",
          user: { id: "user-2", nickname: "HappyDog", schoolId: "school-1", role: "student", kindnessScore: 0 },
        },
      }),
    ],
    [
      "GET /api/posts",
      () => ({
        status: 200,
        data: {
          posts: [
            {
              id: "post-1",
              type: "kindness_act",
              content: "Someone held the door for me today!",
              authorNickname: "BraveOtter",
              authorId: "user-2",
              likeCount: 5,
              commentCount: 1,
              createdAt: new Date().toISOString(),
            },
            {
              id: "post-2",
              type: "support",
              content: "I'm feeling overwhelmed with exams.",
              authorNickname: "CalmFox",
              authorId: "user-3",
              likeCount: 3,
              commentCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        },
      }),
    ],
    [
      "POST /api/posts",
      async (url, options) => {
        const body = JSON.parse((options.body as string) ?? "{}");
        return {
          status: 201,
          data: {
            id: "new-post-1",
            type: body.type ?? "kindness_act",
            content: body.content ?? "",
            authorNickname: "BraveOtter",
            authorId: "user-1",
            likeCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString(),
          },
        };
      },
    ],
    [
      "GET /api/posts/:id",
      () => ({
        status: 200,
        data: {
          id: "post-1",
          type: "kindness_act",
          content: "Someone held the door for me today!",
          authorNickname: "BraveOtter",
          authorId: "user-2",
          likeCount: 5,
          commentCount: 1,
          createdAt: new Date().toISOString(),
        },
      }),
    ],
    [
      "GET /api/posts/:id/comments",
      () => ({
        status: 200,
        data: [
          {
            id: "comment-1",
            postId: "post-1",
            content: "That's so sweet!",
            authorNickname: "CalmFox",
            authorId: "user-3",
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    ],
    [
      "POST /api/posts/:id/comments",
      async (url, options) => {
        const body = JSON.parse((options.body as string) ?? "{}");
        return {
          status: 201,
          data: {
            id: "new-comment-1",
            postId: "post-1",
            content: body.content ?? "",
            authorNickname: "BraveOtter",
            authorId: "user-1",
            createdAt: new Date().toISOString(),
          },
        };
      },
    ],
    [
      "POST /api/reports",
      () => ({
        status: 201,
        data: { id: "report-1", status: "pending" },
      }),
    ],
    [
      "GET /api/schools",
      () => ({
        status: 200,
        data: [
          { id: "school-1", name: "Springfield High", joinCode: "SPR001" },
          { id: "school-2", name: "Riverdale Academy", joinCode: "RIV002" },
        ],
      }),
    ],
    [
      "POST /api/posts/:id/like",
      () => ({ status: 200, data: { liked: true } }),
    ],
    [
      "POST /api/posts/:id/gift",
      () => ({ status: 200, data: { giftsRemainingToday: 4 } }),
    ],
    [
      "PUT /api/users/push-token",
      () => ({ status: 204, data: {} }),
    ],
  ]);

  use(method: string, path: string, handler: RouteHandler) {
    this.overrides.set(`${method} ${path}`, handler);
  }

  reset() {
    this.overrides.clear();
    this.lastRequest = null;
  }

  async handle(input: RequestInfo | URL, options: RequestInit = {}): Promise<ReturnType<typeof makeFetchResponse>> {
    const url = typeof input === "string" ? input : (input as URL).toString();
    const method = (options.method ?? "GET").toUpperCase();

    let body: unknown = undefined;
    if (options.body && typeof options.body === "string") {
      try { body = JSON.parse(options.body); } catch { body = options.body; }
    }

    this.lastRequest = { url, method, body };

    const handler =
      matchRoute(url, method, this.overrides) ??
      matchRoute(url, method, this.defaultRoutes);

    if (!handler) {
      console.warn(`[ApiMock] Unhandled ${method} ${url}`);
      return makeFetchResponse({ error: "Not found" }, 404);
    }

    const response = await handler(url, options);
    return makeFetchResponse(response.data, response.status);
  }
}

export const apiMock = new ApiMock();

export function installFetchMock() {
  (global as unknown as { fetch: unknown }).fetch = jest.fn().mockImplementation(
    (input: RequestInfo | URL, options?: RequestInit) => apiMock.handle(input, options ?? {})
  );
}
