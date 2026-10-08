import { useCallback, useEffect, useState } from "react";

export const useInfiniteScroll = (totalItems: number, pageSize = 10, resetKey?: string) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  useEffect(() => setVisibleCount(pageSize), [pageSize, resetKey]);
  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, totalItems));
  }, [pageSize, totalItems]);
  return { visibleCount: Math.min(visibleCount, totalItems), hasMore: visibleCount < totalItems, loadMore };
};

export const useIntersectionLoadMore = (hasMore: boolean, loadMore: () => void) => {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    if (!target || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { rootMargin: "180px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, hasMore, loadMore]);
  return setTarget;
};
