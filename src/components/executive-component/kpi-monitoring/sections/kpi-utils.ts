import type { Status } from "./kpi-meta";

export function getStatusHex(status: Status): string {
  return status === "on-track" ? "#22c55e" : status === "at-risk" ? "#f59e0b" : "#ef4444";
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
