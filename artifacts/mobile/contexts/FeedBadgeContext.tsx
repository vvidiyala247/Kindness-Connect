import React, { createContext, useCallback, useContext, useRef, useState } from "react";

interface FeedBadgeContextValue {
  newPostCount: number;
  seenTopPostId: string | null;
  markFeedSeen: (topPostId: string | null) => void;
  updateBadge: (posts: { id: string }[]) => void;
}

export const FeedBadgeContext = createContext<FeedBadgeContextValue | null>(null);

export function FeedBadgeProvider({ children }: { children: React.ReactNode }) {
  const [newPostCount, setNewPostCount] = useState(0);
  const seenTopPostIdRef = useRef<string | null>(null);

  const markFeedSeen = useCallback((topPostId: string | null) => {
    seenTopPostIdRef.current = topPostId;
    setNewPostCount(0);
  }, []);

  const updateBadge = useCallback((posts: { id: string }[]) => {
    if (!posts.length) return;

    const seenId = seenTopPostIdRef.current;
    if (seenId === null) {
      seenTopPostIdRef.current = posts[0].id;
      return;
    }

    const seenIndex = posts.findIndex((p) => p.id === seenId);
    if (seenIndex === -1) {
      setNewPostCount(posts.length);
    } else {
      setNewPostCount(seenIndex);
    }
  }, []);

  return (
    <FeedBadgeContext.Provider
      value={{
        newPostCount,
        seenTopPostId: seenTopPostIdRef.current,
        markFeedSeen,
        updateBadge,
      }}
    >
      {children}
    </FeedBadgeContext.Provider>
  );
}

export function useFeedBadge() {
  const ctx = useContext(FeedBadgeContext);
  if (!ctx) throw new Error("useFeedBadge must be used inside FeedBadgeProvider");
  return ctx;
}
