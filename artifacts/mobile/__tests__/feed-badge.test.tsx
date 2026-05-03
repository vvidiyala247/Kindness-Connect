import React from "react";
import { render, act } from "@testing-library/react";
import { FeedBadgeProvider, FeedBadgeContext } from "../contexts/FeedBadgeContext";

function Fixture({ onContext }: { onContext: (ctx: React.ContextType<typeof FeedBadgeContext>) => void }) {
  const ctx = React.useContext(FeedBadgeContext);
  React.useLayoutEffect(() => { onContext(ctx); });
  return null;
}

function renderBadge() {
  let ctx: React.ContextType<typeof FeedBadgeContext> = null;
  render(
    <FeedBadgeProvider>
      <Fixture onContext={(c) => { ctx = c; }} />
    </FeedBadgeProvider>
  );
  return { getCtx: () => ctx! };
}

describe("FeedBadgeContext", () => {
  it("starts with newPostCount of 0", () => {
    const { getCtx } = renderBadge();
    expect(getCtx().newPostCount).toBe(0);
  });

  it("markFeedSeen resets badge to 0 and records seen post id", () => {
    const { getCtx } = renderBadge();
    act(() => { getCtx().markFeedSeen("post-1"); });
    expect(getCtx().newPostCount).toBe(0);
  });

  it("updateBadge counts new posts that appear before the last-seen post", () => {
    const { getCtx } = renderBadge();
    act(() => { getCtx().markFeedSeen("post-1"); });

    act(() => {
      getCtx().updateBadge([
        { id: "new-a" },
        { id: "new-b" },
        { id: "post-1" },
        { id: "post-2" },
      ]);
    });
    expect(getCtx().newPostCount).toBe(2);
  });

  it("updateBadge sets count to 0 when no new posts exist", () => {
    const { getCtx } = renderBadge();
    act(() => { getCtx().markFeedSeen("post-1"); });

    act(() => {
      getCtx().updateBadge([
        { id: "new-a" },
        { id: "new-b" },
        { id: "post-1" },
      ]);
    });
    expect(getCtx().newPostCount).toBe(2);

    act(() => {
      getCtx().updateBadge([{ id: "post-1" }, { id: "post-2" }]);
    });
    expect(getCtx().newPostCount).toBe(0);
  });

  it("updateBadge sets count to posts.length when seen post is no longer in feed", () => {
    const { getCtx } = renderBadge();
    act(() => { getCtx().markFeedSeen("old-post"); });

    act(() => {
      getCtx().updateBadge([{ id: "post-1" }, { id: "post-2" }, { id: "post-3" }]);
    });
    expect(getCtx().newPostCount).toBe(3);
  });

  it("markFeedSeen resets badge after it was updated", () => {
    const { getCtx } = renderBadge();
    act(() => { getCtx().markFeedSeen("post-1"); });
    act(() => {
      getCtx().updateBadge([{ id: "new-a" }, { id: "post-1" }]);
    });
    expect(getCtx().newPostCount).toBe(1);

    act(() => { getCtx().markFeedSeen("new-a"); });
    expect(getCtx().newPostCount).toBe(0);
  });
});
