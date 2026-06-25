import { NextResponse } from "next/server";
import {
  DAILY_DIGITS,
  DAILY_MAX_GUESSES,
  getDailySeed,
  getUtcPuzzleId,
} from "../../../lib/dailyPuzzle";

export function GET() {
  try {
    getDailySeed();
  } catch {
    return NextResponse.json(
      { error: "Daily challenge is not configured on this environment." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      puzzleId: getUtcPuzzleId(),
      digits: DAILY_DIGITS,
      maxGuesses: DAILY_MAX_GUESSES,
      mode: "daily",
    },
    { status: 200 },
  );
}
