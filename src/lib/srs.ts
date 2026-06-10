/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Calculates optimal review intervals based on user performance.
 * 
 * Rating scale:
 *   0 = Again (complete failure, reset)
 *   1 = Hard  (significant difficulty)
 *   2 = Good  (correct with some effort)
 *   3 = Easy  (effortless recall)
 */

export interface SRSCard {
  easeFactor: number;    // Starting at 2.5, minimum 1.3
  interval: number;      // Days until next review
  repetitions: number;   // Count of successful reviews
  nextReviewAt: Date;    // Calculated next review date
  lastReviewAt: Date;    // When the review happened
}

export interface SRSReviewResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

/**
 * Process a flashcard review and return updated SRS parameters.
 * 
 * @param rating - User's rating: 0=Again, 1=Hard, 2=Good, 3=Easy
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @param currentInterval - Current interval in days (default 0)
 * @param currentRepetitions - Current repetition count (default 0)
 * @returns Updated SRS parameters with next review date
 */
export function processReview(
  rating: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): SRSReviewResult {
  // Clamp rating to valid range
  const clampedRating = Math.max(0, Math.min(3, Math.round(rating)));
  
  // Map our 0-3 scale to SM-2's 0-5 quality scale
  // 0 (Again) -> 1, 1 (Hard) -> 2, 2 (Good) -> 4, 3 (Easy) -> 5
  const qualityMap: Record<number, number> = { 0: 1, 1: 2, 2: 4, 3: 5 };
  const quality = qualityMap[clampedRating];

  let newEaseFactor = currentEaseFactor;
  let newInterval = currentInterval;
  let newRepetitions = currentRepetitions;

  if (quality < 3) {
    // Failed review — reset repetitions and interval
    newRepetitions = 0;
    newInterval = 0;
  } else {
    // Successful review — advance interval
    newRepetitions += 1;

    if (newRepetitions === 1) {
      newInterval = 1; // First successful review: 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    currentEaseFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor must never go below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const now = new Date();
  const nextReviewAt = new Date(now);
  
  if (newInterval === 0) {
    // Failed card — review again in 10 minutes (same session)
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  } else {
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  }

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * Get cards that are due for review.
 * A card is due when its nextReviewAt date is in the past or today.
 */
export function isDue(nextReviewAt: Date): boolean {
  return new Date() >= new Date(nextReviewAt);
}

/**
 * Calculate the urgency of a review (higher = more urgent).
 * Cards that are overdue by more days are more urgent.
 */
export function reviewUrgency(nextReviewAt: Date): number {
  const now = new Date();
  const dueDate = new Date(nextReviewAt);
  const diffMs = now.getTime() - dueDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, diffDays);
}

/**
 * Get a human-readable status for a flashcard based on its SRS state.
 */
export function getCardStatus(
  repetitions: number,
  easeFactor: number
): "new" | "learning" | "review" | "mastered" {
  if (repetitions === 0) return "new";
  if (repetitions < 3) return "learning";
  if (easeFactor >= 2.5 && repetitions >= 5) return "mastered";
  return "review";
}

/**
 * Calculate deck statistics.
 */
export function calculateDeckStats(cards: {
  repetitions: number;
  easeFactor: number;
  nextReviewAt: Date;
}[]): {
  total: number;
  new: number;
  learning: number;
  review: number;
  mastered: number;
  dueToday: number;
} {
  const stats = {
    total: cards.length,
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    dueToday: 0,
  };

  for (const card of cards) {
    const status = getCardStatus(card.repetitions, card.easeFactor);
    stats[status]++;
    if (isDue(card.nextReviewAt)) {
      stats.dueToday++;
    }
  }

  return stats;
}
