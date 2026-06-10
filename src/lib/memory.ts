/**
 * Ebbinghaus Forgetting Curve Model
 *
 * Models memory decay using the exponential forgetting curve:
 *   R = e^(-t/S)
 *
 * Where:
 *   R = retention (0-1, probability of recall)
 *   t = time since last review (in days)
 *   S = stability (how resistant the memory is to decay)
 *
 * Stability increases with each successful review.
 */

export interface MemoryState {
  retention: number;      // Current recall probability (0-1)
  stability: number;      // Memory stability factor
  confidenceLevel: "mastered" | "learning" | "needs_review";
  daysUntilForgotten: number; // Days until retention drops below threshold
  urgency: "critical" | "high" | "medium" | "low";
}

const RETENTION_THRESHOLD = 0.3; // Below this, concept is considered "forgotten"
const MASTERY_THRESHOLD = 0.85;   // Above this, concept is "mastered"

/**
 * Calculate current retention for a concept.
 *
 * @param lastReviewAt - Date of the last review
 * @param stability - Memory stability factor (increases with reviews)
 * @returns Current retention value (0-1)
 */
export function calculateRetention(
  lastReviewAt: Date | null,
  stability: number
): number {
  if (!lastReviewAt) return 0;

  const now = new Date();
  const timeSinceReview =
    (now.getTime() - new Date(lastReviewAt).getTime()) / (1000 * 60 * 60 * 24); // days

  if (timeSinceReview <= 0) return 1.0;

  // Ebbinghaus formula: R = e^(-t/S)
  const retention = Math.exp(-timeSinceReview / stability);
  return Math.max(0, Math.min(1, retention));
}

/**
 * Update stability after a review.
 * Successful reviews increase stability; failures decrease it.
 *
 * @param currentStability - Current stability value
 * @param wasSuccessful - Whether the review was successful
 * @param reviewCount - Total number of reviews so far
 * @returns New stability value
 */
export function updateStability(
  currentStability: number,
  wasSuccessful: boolean,
  reviewCount: number
): number {
  if (wasSuccessful) {
    // Each successful review increases stability by a diminishing factor
    // First reviews have biggest impact, later reviews have smaller gains
    const boostFactor = 1.5 + Math.log(1 + reviewCount) * 0.5;
    return Math.min(365, currentStability * boostFactor);
  } else {
    // Failed review reduces stability significantly
    return Math.max(0.5, currentStability * 0.5);
  }
}

/**
 * Calculate the full memory state for a concept.
 */
export function getMemoryState(
  lastReviewAt: Date | null,
  stability: number,
  reviewCount: number
): MemoryState {
  const retention = calculateRetention(lastReviewAt, stability);

  // Calculate days until retention drops below threshold
  let daysUntilForgotten = 0;
  if (retention > RETENTION_THRESHOLD && stability > 0) {
    // Solve: threshold = e^(-t/S) => t = -S * ln(threshold)
    daysUntilForgotten = Math.max(
      0,
      Math.round(-stability * Math.log(RETENTION_THRESHOLD))
    );

    // Subtract days already elapsed
    if (lastReviewAt) {
      const elapsed =
        (new Date().getTime() - new Date(lastReviewAt).getTime()) /
        (1000 * 60 * 60 * 24);
      daysUntilForgotten = Math.max(0, daysUntilForgotten - Math.floor(elapsed));
    }
  }

  // Determine confidence level
  let confidenceLevel: MemoryState["confidenceLevel"];
  if (retention >= MASTERY_THRESHOLD && reviewCount >= 3) {
    confidenceLevel = "mastered";
  } else if (retention >= RETENTION_THRESHOLD) {
    confidenceLevel = "learning";
  } else {
    confidenceLevel = "needs_review";
  }

  // Determine urgency
  let urgency: MemoryState["urgency"];
  if (retention < 0.2) {
    urgency = "critical";
  } else if (retention < 0.4) {
    urgency = "high";
  } else if (retention < 0.6) {
    urgency = "medium";
  } else {
    urgency = "low";
  }

  return {
    retention: Math.round(retention * 100) / 100,
    stability,
    confidenceLevel,
    daysUntilForgotten,
    urgency,
  };
}

/**
 * Sort concepts by review urgency (most urgent first).
 */
export function sortByUrgency<
  T extends { lastReviewAt: Date | null; stability: number }
>(concepts: T[]): T[] {
  return [...concepts].sort((a, b) => {
    const retA = calculateRetention(a.lastReviewAt, a.stability);
    const retB = calculateRetention(b.lastReviewAt, b.stability);
    return retA - retB; // Lower retention = more urgent = first
  });
}

/**
 * Get concepts that will be forgotten within N days.
 */
export function getAboutToForget<
  T extends { lastReviewAt: Date | null; stability: number; reviewCount: number }
>(concepts: T[], withinDays: number = 1): T[] {
  return concepts.filter((c) => {
    const state = getMemoryState(c.lastReviewAt, c.stability, c.reviewCount);
    return state.daysUntilForgotten <= withinDays && state.retention > 0.1;
  });
}
