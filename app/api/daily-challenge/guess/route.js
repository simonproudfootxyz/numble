import { NextResponse } from "next/server";
import {
  DAILY_MAX_GUESSES,
  deriveDailyAnswer,
  getDailySeed,
  getUtcPuzzleId,
  isValidGuess,
  scoreGuess,
} from "../../../../lib/dailyPuzzle";

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { puzzleId, guess, attemptNumber } = payload ?? {};

  if (typeof puzzleId !== "string") {
    return NextResponse.json({ error: "puzzleId is required." }, { status: 400 });
  }

  const expectedPuzzleId = getUtcPuzzleId();
  if (puzzleId !== expectedPuzzleId) {
    return NextResponse.json(
      { error: "Stale puzzleId.", expectedPuzzleId },
      { status: 409 },
    );
  }

  if (typeof guess !== "string" || !isValidGuess(guess)) {
    return NextResponse.json(
      { error: "Guess must be exactly 7 digits (0-9)." },
      { status: 400 },
    );
  }

  if (
    typeof attemptNumber !== "number" ||
    !Number.isInteger(attemptNumber) ||
    attemptNumber < 1 ||
    attemptNumber > DAILY_MAX_GUESSES
  ) {
    return NextResponse.json(
      { error: `attemptNumber must be an integer between 1 and ${DAILY_MAX_GUESSES}.` },
      { status: 400 },
    );
  }

  let seed;
  try {
    seed = getDailySeed();
  } catch {
    return NextResponse.json(
      { error: "Daily challenge is not configured on this environment." },
      { status: 500 },
    );
  }

  const answer = deriveDailyAnswer({ puzzleId, seed });
  const colors = scoreGuess(guess, answer);
  const isWin = guess === answer;
  const isGameOver = isWin || attemptNumber >= DAILY_MAX_GUESSES;
  const attemptsUsed = attemptNumber;
  const attemptsRemaining = Math.max(DAILY_MAX_GUESSES - attemptsUsed, 0);

  return NextResponse.json(
    {
      puzzleId,
      guess,
      colors,
      isWin,
      isGameOver,
      attemptsUsed,
      attemptsRemaining,
      ...(isGameOver && !isWin ? { answer } : {}),
    },
    { status: 200 },
  );
}
