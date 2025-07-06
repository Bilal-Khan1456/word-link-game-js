let timeRemaining = 15;
let timerInterval;
let usedWords = [];
let lastLetter = null;
let isPaused = false;
let gameMode = "player-vs-computer"; // Default mode
let currentPlayer = 1; // For Player vs Player mode

// Separate leaderboards for the two game modes
let computerLeaderboard = JSON.parse(localStorage.getItem("computerLeaderboard")) || [];
let playerLeaderboard = JSON.parse(localStorage.getItem("playerLeaderboard")) || [];

// Score tracking
let playerScore = 0; // For Player vs Computer
let player1Score = 0; // For Player vs Player
let player2Score = 0; // For Player vs Player
let player1Name = "You";
let player2Name = "Computer";

// DOM Elements
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const gameOverScreen = document.getElementById("game-over-screen");
const timerDisplay = document.getElementById("time-remaining");
const timerProgress = document.getElementById("timer-progress");
const wordInput = document.getElementById("word-input");
const submitBtn = document.getElementById("submit-btn");
const playerNameScreen = document.getElementById("player-name-screen");
const gameStatus = document.getElementById("game-status");
const playerTurn = document.getElementById("player-turn");
const usedWordsList = document.getElementById("used-words");
const scoreDisplay = document.getElementById("score-display");
const finalScore = document.getElementById("final-score");
const winnerDisplay = document.getElementById("winner-display");
const restartGameBtn = document.getElementById("restart-game-btn");
const playerVsCompBtn = document.getElementById("player-vs-computer-btn");
const playerVsPlayerBtn = document.getElementById("player-vs-player-btn");
const pauseBtn = document.getElementById("pause-btn");
const gameOverBtn = document.getElementById("game-over-btn");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const leaderboardBtn = document.getElementById("leaderboard-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const backToMenuBtnEnd = document.getElementById("back-to-menu-btn-end");
const leaderboardList = document.getElementById("leaderboard-list");
const backBtn = document.getElementById("back-btn");
const player1NameInput = document.getElementById("player1-name");
const player2NameInput = document.getElementById("player2-name");
const leaderboardTitle = document.getElementById("leaderboard-title");
const leaderboardToggle = document.getElementById("leaderboard-toggle");

// Timer function with visual progress bar
function startTimer() {
  clearInterval(timerInterval);
  timerProgress.style.width = "100%";
  
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeRemaining--;
      timerDisplay.textContent = timeRemaining;
      
      // Update progress bar
      const progressPercentage = (timeRemaining / 15) * 100;
      timerProgress.style.width = `${progressPercentage}%`;
      
      // Change color based on time remaining
      if (timeRemaining <= 5) {
        timerProgress.style.backgroundColor = "#e74c3c";
      } else if (timeRemaining <= 10) {
        timerProgress.style.backgroundColor = "#f1c40f";
      } else {
        timerProgress.style.backgroundColor = "#4caf50";
      }
      
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        endGame("Time's up! Game Over!");
      }
    }
  }, 1000);
}

// Computer's turn to play a word
async function getComputerWord(startLetter) {
  try {
    const response = await fetch(`https://api.datamuse.com/words?sp=${startLetter}*&max=10`);
    const data = await response.json();
    // Filter out words that have already been used
    const availableWords = data.filter(word => !usedWords.includes(word.word));
    return availableWords.length > 0 ? availableWords[0].word : null;
  } catch (error) {
    console.error("Error fetching word:", error);
    return null;
  }
}

async function handleComputerTurn() {
  // Visual indication that computer is thinking
  gameStatus.textContent = "Bilal is thinking...";
  wordInput.disabled = true;
  submitBtn.disabled = true;
  
  setTimeout(async () => {
    const word = await getComputerWord(lastLetter || "a");
    wordInput.disabled = false;
    submitBtn.disabled = false;
    
    if (word && !usedWords.includes(word)) {
      addWord(word, false); // false -> Do not count score for computer
      gameStatus.textContent = `Bilal played: ${word}. Your turn!`;
    } else {
      endGame("Bilal couldn't find a word. You win!");
    }
  }, 1000); // Delay to simulate thinking
}

// Validate word with the API
async function validateWord(word) {
  if (!word) return "Please enter a word.";
  if (!/^[a-z]+$/i.test(word)) return "Word must contain only letters.";
  if (usedWords.includes(word)) return "Word already used.";
  if (lastLetter && word[0].toLowerCase() !== lastLetter.toLowerCase()) 
    return `Word must start with '${lastLetter}'.`;
  if (word.length < 2) return "Word must be at least 2 letters long.";
  
  try {
    const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
    const data = await response.json();
    return data.length === 0 || data[0].word !== word ? "Invalid word." : true;
  } catch (error) {
    return "Network error. Try again.";
  }
}

// Load and display leaderboard
function loadLeaderboard(mode = "computer") {
  const scores = mode === "computer" ? computerLeaderboard : playerLeaderboard;
  
  leaderboardTitle.textContent = mode === "computer" 
    ? "Player vs Bilal Leaderboard" 
    : "Player vs Player Leaderboard";
  
  leaderboardList.innerHTML = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry, index) => {
      return `<li>
        <span>Rank #${index + 1}</span>
        <span>${entry.name || "Player"}: ${entry.score} points</span>
      </li>`;
    })
    .join("");
    
  if (scores.length === 0) {
    leaderboardList.innerHTML = "<li>No scores yet. Play a game!</li>";
  }
}

// Toggle between leaderboards
function toggleLeaderboard() {
  const currentMode = leaderboardToggle.dataset.mode;
  const newMode = currentMode === "computer" ? "player" : "computer";
  
  leaderboardToggle.dataset.mode = newMode;
  leaderboardToggle.textContent = newMode === "computer" 
    ? "Show Player vs Player" 
    : "Show Player vs Bilal";
  
  loadLeaderboard(newMode);
}

// Add a word to the game
function addWord(word, countScore = true) {
  usedWords.push(word);
  lastLetter = word[word.length - 1];

  // Scoring logic with bonus for words 6+ letters
  if (countScore) {
    let points = word.length;
    let isBonus = false;
    
    // Bonus for words 6+ letters
    if (word.length >= 6) {
      points *= 2;
      isBonus = true;
      showBonusNotification();
    }
    
    if (gameMode === "player-vs-computer") {
      playerScore += points;
      scoreDisplay.textContent = `Your Score: ${playerScore}`;
    } else if (gameMode === "player-vs-player") {
      if (currentPlayer === 1) {
        player1Score += points;
      } else {
        player2Score += points;
      }
      scoreDisplay.textContent = `${player1Name}: ${player1Score} | ${player2Name}: ${player2Score}`;
    }

    const listItem = document.createElement("li");
    listItem.textContent = word + (isBonus ? " (2x Bonus!)" : "");
    if (isBonus) {
      listItem.classList.add("bonus");
    }
    usedWordsList.appendChild(listItem);
  } else {
    // Computer's word
    const listItem = document.createElement("li");
    listItem.textContent = word;
    usedWordsList.appendChild(listItem);
  }

  // Ensure only the last three words remain visible
  while (usedWordsList.children.length > 3) {
    usedWordsList.removeChild(usedWordsList.firstChild);
  }

  // Reset the timer after each valid word
  timeRemaining = 15;
  timerDisplay.textContent = timeRemaining;
  timerProgress.style.width = "100%";
  timerProgress.style.backgroundColor = "#4caf50";
  
  if (gameMode === "player-vs-player") {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    gameStatus.textContent = `${currentPlayer === 1 ? player1Name : player2Name}'s turn!`;
    playerTurn.textContent = `Current Turn: ${currentPlayer === 1 ? player1Name : player2Name}`;
  }
}

// Show bonus notification
function showBonusNotification() {
  const notification = document.createElement("div");
  notification.className = "bonus-notification";
  notification.textContent = "BONUS WORD! 2x POINTS!";
  document.body.appendChild(notification);
  
  // Remove notification after animation completes
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}

// End the game
function endGame(message) {
  clearInterval(timerInterval);
  gameContainer.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");

  if (gameMode === "player-vs-computer") {
    finalScore.textContent = `Your Final Score: ${playerScore}`;
    updateLeaderboard(playerScore, player1Name, "computer");
    winnerDisplay.textContent = message;
  } else {
    finalScore.textContent = `Final Scores: ${player1Name}: ${player1Score} | ${player2Name}: ${player2Score}`;
    
    // Determine winner for Player vs Player
    if (player1Score > player2Score) {
      winnerDisplay.textContent = `${player1Name} wins!`;
      updateLeaderboard(player1Score, player1Name, "player");
    } else if (player2Score > player1Score) {
      winnerDisplay.textContent = `${player2Name} wins!`;
      updateLeaderboard(player2Score, player2Name, "player");
    } else {
      winnerDisplay.textContent = "It's a tie!";
      // Record both scores
      updateLeaderboard(player1Score, player1Name, "player");
      updateLeaderboard(player2Score, player2Name, "player");
    }
  }
}

// Update leaderboard with new score
function updateLeaderboard(newScore, playerName, mode) {
  const scoreEntry = {
    name: playerName,
    score: newScore
  };
  
  if (mode === "computer") {
    computerLeaderboard.push(scoreEntry);
    computerLeaderboard.sort((a, b) => b.score - a.score);
    computerLeaderboard = computerLeaderboard.slice(0, 5); // Show top 5 scores
    localStorage.setItem("computerLeaderboard", JSON.stringify(computerLeaderboard));
  } else {
    playerLeaderboard.push(scoreEntry);
    playerLeaderboard.sort((a, b) => b.score - a.score);
    playerLeaderboard = playerLeaderboard.slice(0, 5); // Show top 5 scores
    localStorage.setItem("playerLeaderboard", JSON.stringify(playerLeaderboard));
  }
}

// Toggle pause state
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  gameStatus.textContent = isPaused
    ? "Game Paused"
    : lastLetter 
      ? `Next word must start with '${lastLetter}'.`
      : "Start by entering a word.";
}

// Event Listeners
submitBtn.addEventListener("click", async () => {
  if (isPaused) return;
  
  const word = wordInput.value.trim().toLowerCase();
  const validationMessage = await validateWord(word);
  
  if (validationMessage === true) {
    addWord(word, true);
    wordInput.value = "";

    if (gameMode === "player-vs-computer") {
      setTimeout(handleComputerTurn, 1000);
    }
  } else {
    gameStatus.textContent = validationMessage;
    wordInput.classList.add("error");
    
    // Remove error class after 1.5 seconds
    setTimeout(() => {
      wordInput.classList.remove("error");
    }, 1500);
  }
});

// Allow Enter key to submit word
wordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    submitBtn.click();
  }
});

// Pause Button
pauseBtn.addEventListener("click", togglePause);

// Game Over Button
gameOverBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to end the game?")) {
    endGame("Game ended early.");
  }
});

// Player vs Computer Button
playerVsCompBtn.addEventListener("click", () => {
  gameMode = "player-vs-computer";
  player1Name = "You";
  player2Name = "Computer";
  
  // Skip player name screen for Player vs Computer
  startScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  
  // Reset any previous game state
  resetGame();
  
  // Setup game for Player vs Computer
  gameStatus.textContent = "Start by entering a word.";
  playerTurn.textContent = "Your Turn";
  scoreDisplay.textContent = "Your Score: 0";
  
  startTimer();
});

// Player vs Player Button
playerVsPlayerBtn.addEventListener("click", () => {
  gameMode = "player-vs-player";
  startScreen.classList.add("hidden");
  playerNameScreen.classList.remove("hidden");
  
  // Clear previous names
  player1NameInput.value = "";
  player2NameInput.value = "";
});

// Back Button from Player Name Screen
backBtn.addEventListener("click", () => {
  playerNameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

// Start Game Button (after entering player names)
document.getElementById("start-game-btn").addEventListener("click", () => {
  player1Name = player1NameInput.value.trim() || "Player 1";
  player2Name = player2NameInput.value.trim() || "Player 2";

  playerNameScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  
  // Reset any previous game state
  resetGame();
  
  // Setup game for Player vs Player
  currentPlayer = 1;
  gameStatus.textContent = `${player1Name}'s Turn`;
  playerTurn.textContent = `Current Turn: ${player1Name}`;
  scoreDisplay.textContent = `${player1Name}: 0 | ${player2Name}: 0`;
  
  startTimer();
});

// Restart Game Button
restartGameBtn.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  
  if (gameMode === "player-vs-computer") {
    gameContainer.classList.remove("hidden");
    resetGame();
  } else {
    // For Player vs Player, go back to name input
    playerNameScreen.classList.remove("hidden");
    
    // Clear previous names
    player1NameInput.value = "";
    player2NameInput.value = "";
  }
});

// Back to Menu Buttons
backToMenuBtn.addEventListener("click", () => {
  leaderboardScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

backToMenuBtnEnd.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

// Leaderboard Button
leaderboardBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  leaderboardScreen.classList.remove("hidden");
  loadLeaderboard(leaderboardToggle.dataset.mode || "computer");
});

// Leaderboard Toggle Button
leaderboardToggle.addEventListener("click", toggleLeaderboard);

// Reset game state
function resetGame() {
  timeRemaining = 15;
  usedWords = [];
  lastLetter = null;
  isPaused = false;
  
  // Reset scores
  playerScore = 0;
  player1Score = 0;
  player2Score = 0;
  
  // Reset UI
  timerDisplay.textContent = timeRemaining;
  timerProgress.style.width = "100%";
  timerProgress.style.backgroundColor = "#4caf50";
  wordInput.value = "";
  usedWordsList.innerHTML = "";
  pauseBtn.textContent = "Pause";
  
  if (gameMode === "player-vs-computer") {
    gameStatus.textContent = "Start by entering a word.";
    playerTurn.textContent = "Your Turn";
    scoreDisplay.textContent = "Your Score: 0";
  } else {
    currentPlayer = 1;
    gameStatus.textContent = `${player1Name}'s Turn`;
    playerTurn.textContent = `Current Turn: ${player1Name}`;
    scoreDisplay.textContent = `${player1Name}: 0 | ${player2Name}: 0`;
  }
  
  // Ensure word input is enabled
  wordInput.disabled = false;
  submitBtn.disabled = false;
  
  startTimer();
}

// Initialize game
window.addEventListener("load", () => {
  // Check if there's any saved leaderboard
  computerLeaderboard = JSON.parse(localStorage.getItem("computerLeaderboard")) || [];
  playerLeaderboard = JSON.parse(localStorage.getItem("playerLeaderboard")) || [];
  
  // Set default leaderboard toggle mode
  leaderboardToggle.dataset.mode = "computer";
});
