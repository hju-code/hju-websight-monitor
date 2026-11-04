import type { KinDetectStatus } from "./types";

/** Confirmation is manual; unconfirmed questions must remain visible. */
export function needsAnswerReview(status: KinDetectStatus): boolean {
  return status !== "manual_posted";
}
