import { describe, expect, it } from "vitest";
import {
  DAILY_DIGITS,
  deriveDailyAnswer,
  getUtcPuzzleId,
  isValidGuess,
} from "./dailyPuzzle.js";

describe("daily puzzle answers", () => {
  it("can start with a leading 0 and still be valid", () => {
    const seed = "leading-zero-test-seed";
    let leadingZeroAnswer = null;

    // Search a bounded, deterministic range of puzzle ids.
    for (let day = 1; day <= 366; day += 1) {
      const date = new Date(Date.UTC(2026, 0, day));
      const puzzleId = getUtcPuzzleId(date);
      const answer = deriveDailyAnswer({ puzzleId, seed, digits: DAILY_DIGITS });

      if (answer.startsWith("0")) {
        leadingZeroAnswer = answer;
        break;
      }
    }

    expect(leadingZeroAnswer).toBeTruthy();
    expect(leadingZeroAnswer.startsWith("0")).toBe(true);
    expect(isValidGuess(leadingZeroAnswer, DAILY_DIGITS)).toBe(true);
  });
});
