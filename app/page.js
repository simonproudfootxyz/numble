"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_DIGITS = 7;
const FALLBACK_MAX_GUESSES = 6;

function safeReadDailyState(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWriteDailyState(storageKey, state) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private mode/quota issues).
  }
}

function isValidGuess(guess, digits) {
  const pattern = new RegExp(`^\\d{${digits}}$`);
  return pattern.test(guess);
}

function getEmojiGrid(guessRows) {
  const emojiByColor = {
    green: "🟩",
    yellow: "🟨",
    gray: "⬛",
  };

  return guessRows
    .map((row) =>
      row.colors
        .map((color) => emojiByColor[color] || emojiByColor.gray)
        .join(""),
    )
    .join("\n");
}

export default function DailyChallengePage() {
  const [puzzleId, setPuzzleId] = useState("");
  const [digits, setDigits] = useState(FALLBACK_DIGITS);
  const [maxGuesses, setMaxGuesses] = useState(FALLBACK_MAX_GUESSES);
  const [guesses, setGuesses] = useState([]);
  const [guessInput, setGuessInput] = useState("");
  const [message, setMessage] = useState("Loading daily challenge...");
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Daily Challenge");
  const [modalResultText, setModalResultText] = useState("");
  const [showShareActions, setShowShareActions] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  const storageKey = useMemo(
    () => (puzzleId ? `numble:daily:${puzzleId}` : ""),
    [puzzleId],
  );

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/daily-challenge", {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Could not load daily challenge.");
        }

        if (!isMounted) {
          return;
        }

        setPuzzleId(data.puzzleId);
        setDigits(data.digits);
        setMaxGuesses(data.maxGuesses);

        const key = `numble:daily:${data.puzzleId}`;
        const saved = safeReadDailyState(key);

        if (!saved) {
          setMessage("Guess the 7-digit phone number in 6 tries or less.");
          return;
        }

        const savedGuesses = Array.isArray(saved.guesses) ? saved.guesses : [];
        const savedGameOver = Boolean(saved.isGameOver);
        const savedIsWin = Boolean(saved.isWin);
        const savedAnswer =
          typeof saved.answer === "string" ? saved.answer : "";

        setGuesses(savedGuesses);
        setGameOver(savedGameOver);

        if (!savedGameOver) {
          setMessage(
            `${Math.max(data.maxGuesses - savedGuesses.length, 0)} guesses left.`,
          );
          return;
        }

        setMessage("You already completed today's daily challenge.");
        setModalTitle(savedIsWin ? "You Win!" : "Out of Guesses");
        setModalResultText(
          savedIsWin
            ? `You got it in ${savedGuesses.length}/${data.maxGuesses}!`
            : `Answer was ${savedAnswer}.`,
        );
        setShowShareActions(savedIsWin);
        setIsModalOpen(true);
      } catch (error) {
        if (isMounted) {
          setMessage(error.message || "Could not load daily challenge.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  function getShareMessage() {
    const emojiGrid = getEmojiGrid(guesses);
    return `I solved today's Numble (${puzzleId}) in ${guesses.length}/6 guesses! \n${emojiGrid}\nThink you can beat me? ${window.location.origin}`;
  }

  function openShareUrl(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareOnReddit() {
    const shareText = getShareMessage();
    const url = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}&text=${encodeURIComponent(shareText)}`;
    openShareUrl(url);
  }

  function shareOnBluesky() {
    const shareText = getShareMessage();
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`;
    openShareUrl(url);
  }

  function shareOnTwitter() {
    const shareText = getShareMessage();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    openShareUrl(url);
  }

  async function copyShareText() {
    const shareText = getShareMessage();
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus("Result copied to clipboard.");
    } catch {
      setShareStatus("Could not copy automatically.");
      window.prompt("Copy your result:", shareText);
    }
  }

  async function submitGuess() {
    if (isLoading || !puzzleId) {
      return;
    }

    if (gameOver) {
      setMessage("You already completed today's daily challenge.");
      return;
    }

    const guess = guessInput.trim();
    if (!isValidGuess(guess, digits)) {
      setMessage(`Enter exactly ${digits} digits (0-9).`);
      return;
    }

    const attemptNumber = guesses.length + 1;
    setIsLoading(true);

    try {
      const response = await fetch("/api/daily-challenge/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, guess, attemptNumber }),
      });
      const data = await response.json();

      if (response.status === 409) {
        setMessage(
          "Daily challenge rolled over. Refresh to play today's puzzle.",
        );
        return;
      }

      if (!response.ok) {
        setMessage(data?.error || "Could not submit guess.");
        return;
      }

      const nextGuesses = [
        ...guesses,
        { value: data.guess, colors: data.colors },
      ];
      setGuesses(nextGuesses);
      setGuessInput("");

      if (data.isWin) {
        setGameOver(true);
        setMessage("You already completed today's daily challenge.");
        setModalTitle("You Win!");
        setModalResultText(
          `You got it in ${nextGuesses.length}/${maxGuesses}!`,
        );
        setShowShareActions(true);
        setIsModalOpen(true);
        safeWriteDailyState(storageKey, {
          puzzleId,
          guesses: nextGuesses,
          isGameOver: true,
          isWin: true,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      if (data.isGameOver) {
        setGameOver(true);
        setMessage("You already completed today's daily challenge.");
        setModalTitle("Out of Guesses");
        setModalResultText(`Answer was ${data.answer}.`);
        setShowShareActions(false);
        setIsModalOpen(true);
        safeWriteDailyState(storageKey, {
          puzzleId,
          guesses: nextGuesses,
          isGameOver: true,
          isWin: false,
          answer: data.answer,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      setMessage(`${Math.max(data.attemptsRemaining, 0)} guesses left.`);
      safeWriteDailyState(storageKey, {
        puzzleId,
        guesses: nextGuesses,
        isGameOver: false,
        isWin: false,
      });
    } catch {
      setMessage("Network error while submitting guess.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      submitGuess();
    }
  }

  return (
    <>
      <div className="app">
        <h1>Numble Daily</h1>
        <p>Guess today's 7-digit phone number</p>
        <div className="controls">
          <input
            type="tel"
            inputMode="tel"
            maxLength={digits}
            placeholder={`Enter ${digits} digits`}
            value={guessInput}
            onChange={(event) => setGuessInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading || gameOver}
          />
          <button
            type="button"
            className="primary"
            onClick={submitGuess}
            disabled={isLoading || gameOver}
          >
            {isLoading ? "Loading..." : "Guess"}
          </button>
        </div>
        <div className="board">
          {Array.from({ length: maxGuesses }, (_, row) => {
            const guessObj = guesses[row];
            const rowDigits = guessObj ? guessObj.value.split("") : [];

            return (
              <div className="row" key={row}>
                {Array.from({ length: digits }, (_, col) => {
                  const digit = rowDigits[col];
                  const colorClass = guessObj ? guessObj.colors[col] : "";
                  const isHyphen = col === 2;
                  const tileClass = [
                    "tile",
                    digit !== undefined ? "filled" : "",
                    colorClass,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <>
                      <div className={tileClass} key={col}>
                        {digit ?? ""}
                      </div>
                      {isHyphen && (
                        <div className="tile tile--blank tile--hyphen">-</div>
                      )}
                    </>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="legend">
          <span className="dot green" /> correct digit + position
          <span className="dot yellow" /> digit exists, wrong position
          <span className="dot gray" /> digit not in answer
        </div>
      </div>

      <div className="modal" hidden={!isModalOpen}>
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dailyResultTitle"
        >
          <h2 id="dailyResultTitle">{modalTitle}</h2>
          <p className="modal-result">{modalResultText}</p>
          <div
            className="share"
            style={{ display: showShareActions ? "flex" : "none" }}
          >
            <button
              type="button"
              className="secondary"
              onClick={shareOnTwitter}
            >
              Share on Twitter
            </button>

            <button
              type="button"
              className="secondary"
              onClick={shareOnBluesky}
            >
              Share on Bluesky
            </button>
            <button type="button" className="secondary" onClick={shareOnReddit}>
              Share on Reddit
            </button>
            <button type="button" className="secondary" onClick={copyShareText}>
              Copy result
            </button>
          </div>
          {shareStatus && <p className="modal-share-status">{shareStatus}</p>}
          <div className="modal-actions">
            <Link href="/unlimited" className="primary">
              New Game
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
