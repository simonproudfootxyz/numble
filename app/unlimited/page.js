"use client";

import { useEffect, useState } from "react";

const DIGITS = 7;
const MAX_GUESSES = 6;

function randomDigitString(length) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += Math.floor(Math.random() * 10);
  }
  return output;
}

function scoreGuess(guess, answer) {
  const result = Array(DIGITS).fill("gray");
  const remainingCounts = {};

  for (let i = 0; i < DIGITS; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = "green";
      continue;
    }
    const answerDigit = answer[i];
    remainingCounts[answerDigit] = (remainingCounts[answerDigit] || 0) + 1;
  }

  for (let i = 0; i < DIGITS; i += 1) {
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

export default function Home() {
  const [secret, setSecret] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [guessInput, setGuessInput] = useState("");
  const [message, setMessage] = useState(
    "Guess the 7-digit phone number in 6 tries or less.",
  );
  const [gameOver, setGameOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Game Over");
  const [modalResultText, setModalResultText] = useState("");
  const [showShareActions, setShowShareActions] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  function initGame() {
    setSecret(randomDigitString(DIGITS));
    setGuesses([]);
    setGuessInput("");
    setMessage("Guess the 7-digit phone number in 6 tries or less.");
    setGameOver(false);
    setIsModalOpen(false);
    setShowShareActions(false);
    setShareStatus("");
  }

  useEffect(() => {
    initGame();
  }, []);

  const getPhoneNumber = (value) => {
    const digits = String(value ?? "");
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  };

  function getShareMessage() {
    const emojiGrid = getEmojiGrid(guesses);
    return `Dialtone Unlimited ${guesses.length}/6\n${emojiGrid}\n${window.location.origin}/unlimited`;
  }

  function showResultModal({ title, resultText, showShare }) {
    setModalTitle(title);
    setModalResultText(resultText);
    setShowShareActions(showShare);
    setShareStatus("");
    setIsModalOpen(true);
  }

  function validateGuess(guess) {
    return /^\d{7}$/.test(guess);
  }

  function submitGuess() {
    if (gameOver) {
      return;
    }

    const guess = guessInput.trim();

    if (!validateGuess(guess)) {
      setMessage("Enter exactly 7 digits (0-9).");
      return;
    }

    if (guesses.length >= MAX_GUESSES) {
      return;
    }

    const colors = scoreGuess(guess, secret);
    const nextGuesses = [...guesses, { value: guess, colors }];
    setGuesses(nextGuesses);

    if (guess === secret) {
      setGameOver(true);
      setMessage("");
      showResultModal({
        title: "You Win!",
        resultText: `You guessed "${secret}" in ${nextGuesses.length}/${MAX_GUESSES} tries!`,
        showShare: true,
      });
      return;
    }

    if (nextGuesses.length === MAX_GUESSES) {
      setGameOver(true);
      setMessage("");
      showResultModal({
        title: "Out of Guesses",
        resultText: `Answer was ${secret}.`,
        showShare: false,
      });
      return;
    }

    setMessage(`${MAX_GUESSES - nextGuesses.length} guesses left.`);
    setGuessInput("");
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

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      submitGuess();
    }
  }

  return (
    <>
      <div className="app">
        <h1>Dialtone</h1>
        <p>Guess the 7-digit phone number in 6 tries or less</p>
        <div className="controls">
          <input
            id="guessInput"
            inputMode="tel"
            type="tel"
            maxLength={DIGITS}
            placeholder="Enter 7 digits"
            value={guessInput}
            onChange={(event) => setGuessInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={gameOver}
          />
          <button
            type="button"
            className="primary"
            onClick={submitGuess}
            disabled={gameOver}
          >
            Guess
          </button>
        </div>
        <div className="board">
          {Array.from({ length: MAX_GUESSES }, (_, row) => {
            const guessObj = guesses[row];
            const digits = guessObj ? guessObj.value.split("") : [];

            return (
              <div className="row" key={row}>
                {Array.from({ length: DIGITS }, (_, col) => {
                  const digit = digits[col];
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
          aria-labelledby="resultTitle"
        >
          <h2 id="resultTitle">{modalTitle}</h2>
          {modalResultText && <p className="modal-result">{modalResultText}</p>}
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
          <p className="modal-share-status">{shareStatus}</p>
          <p>There will be a new challenge tomorrow, see you then!</p>
          <div className="modal-actions">
            <button type="button" className="primary" onClick={initGame}>
              Play Unlimited Mode
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
