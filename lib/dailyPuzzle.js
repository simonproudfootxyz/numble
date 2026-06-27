import crypto from "node:crypto";

export const DAILY_DIGITS = 7;
export const DAILY_MAX_GUESSES = 6;

export function getUtcPuzzleId(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidGuess(guess, digits = DAILY_DIGITS) {
  const guessPattern = new RegExp(`^\\d{${digits}}$`);
  return guessPattern.test(guess);
}

export function deriveDailyAnswer({ puzzleId, seed, digits = DAILY_DIGITS }) {
  const hash = crypto
    .createHmac("sha256", seed)
    .update(`dialtone-daily:${puzzleId}`)
    .digest();

  let output = "";
  for (let i = 0; i < digits; i += 1) {
    output += String(hash[i] % 10);
  }
  return output;
}

export function scoreGuess(guess, answer) {
  const result = Array(answer.length).fill("gray");
  const remainingCounts = {};

  for (let i = 0; i < answer.length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = "green";
      continue;
    }
    const answerDigit = answer[i];
    remainingCounts[answerDigit] = (remainingCounts[answerDigit] || 0) + 1;
  }

  for (let i = 0; i < answer.length; i += 1) {
    if (result[i] !== "gray") {
      continue;
    }
    const guessDigit = guess[i];
    if (remainingCounts[guessDigit] > 0) {
      result[i] = "yellow";
      remainingCounts[guessDigit] -= 1;
    }
  }

  return result;
}

export function getDailySeed() {
  const seed = process.env.DAILY_SEED;
  if (!seed) {
    throw new Error("DAILY_SEED is not set.");
  }
  return seed;
}
