import React from "react";
import { useIntersectionLoadMore } from "../hooks/useInfiniteScroll";

export default function InfiniteScrollTrigger({ hasMore, onLoadMore }: { hasMore: boolean; onLoadMore: () => void }) {
  const attach = useIntersectionLoadMore(hasMore, onLoadMore);
  if (!hasMore) return null;
  return <div ref={attach} className="infinite-scroll-trigger" aria-hidden="true">Loading more…</div>;
}
