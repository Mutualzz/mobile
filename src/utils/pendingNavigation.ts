import type { Href } from "expo-router";

let pendingHref: Href | null = null;

export function setPendingNavigation(href: Href) {
  pendingHref = href;
}

export function peekPendingNavigation(): Href | null {
  return pendingHref;
}

export function consumePendingNavigation(): Href | null {
  const href = pendingHref;
  pendingHref = null;
  return href;
}
