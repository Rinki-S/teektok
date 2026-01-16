"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ShortsNavigator } from "@/components/shorts-navigator";

/**
 * Global Shorts navigation context.
 *
 * Goal:
 * - Let the video view (inside the rounded container) publish navigation ability/state
 *   (current index, total, and imperative next/prev handlers).
 * - Let the layout render the navigator OUTSIDE the rounded container, while still
 *   controlling the feed inside.
 *
 * Usage:
 * 1) Wrap your layout (or a top-level subtree) with <ShortsNavProvider>.
 * 2) Inside the feed/page, call useShortsNav().setState(...) to wire up handlers.
 * 3) Render <ShortsNavigatorPresenter /> in the layout column outside the rounded container.
 */

type ShortsNavState = {
  currentIndex: number;
  total: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goPrevious: () => void;
  goNext: () => void;
};

type ShortsNavApi = {
  /**
   * Replace the current navigation state.
   * Typically called by the page that owns the feed.
   */
  setState: (next: Partial<ShortsNavState>) => void;

  /**
   * Reset to a safe default (e.g., when leaving the feed route).
   */
  reset: () => void;

  /**
   * Read-only state.
   */
  state: ShortsNavState;
};

const noop = () => {};

const defaultState: ShortsNavState = {
  currentIndex: 0,
  total: 0,
  canGoPrevious: false,
  canGoNext: false,
  goPrevious: noop,
  goNext: noop,
};

const ShortsNavContext = createContext<ShortsNavApi | null>(null);

export function ShortsNavProvider({ children }: { children: React.ReactNode }) {
  const [state, setInternalState] = useState<ShortsNavState>(defaultState);

  const setState = useCallback((next: Partial<ShortsNavState>) => {
    setInternalState((prev) => {
      const merged: ShortsNavState = {
        ...prev,
        ...next,
      };

      // Ensure canGoPrevious/canGoNext are consistent if caller provided indices/totals.
      // Caller can still override explicitly by passing canGoPrevious/canGoNext.
      const computedCanGoPrevious =
        next.canGoPrevious ??
        (merged.total > 0 ? merged.currentIndex > 0 : false);
      const computedCanGoNext =
        next.canGoNext ??
        (merged.total > 0 ? merged.currentIndex < merged.total - 1 : false);

      return {
        ...merged,
        canGoPrevious: computedCanGoPrevious,
        canGoNext: computedCanGoNext,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setInternalState(defaultState);
  }, []);

  const api = useMemo<ShortsNavApi>(
    () => ({
      state,
      setState,
      reset,
    }),
    [state, setState, reset],
  );

  return (
    <ShortsNavContext.Provider value={api}>{children}</ShortsNavContext.Provider>
  );
}

export function useShortsNav(): ShortsNavApi {
  const ctx = useContext(ShortsNavContext);
  if (!ctx) {
    throw new Error("useShortsNav must be used within ShortsNavProvider");
  }
  return ctx;
}

/**
 * Presenter that renders the navigator UI using global state.
 *
 * Place this OUTSIDE the rounded container (e.g. in layout right column).
 * By default it's desktop-only (the underlying ShortsNavigator hides itself on mobile).
 */
export function ShortsNavigatorPresenter({
  className,
}: {
  className?: string;
}) {
  const { state } = useShortsNav();

  if (state.total <= 0) {
    return null;
  }

  return (
    <div className={className}>
      <ShortsNavigator
        onPrevious={state.goPrevious}
        onNext={state.goNext}
        canGoPrevious={state.canGoPrevious}
        canGoNext={state.canGoNext}
      />
    </div>
  );
}
