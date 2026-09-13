// lib/sounds.js
export const playSound = (type) => {
  const audio = new Audio(
    type === "success"
      ? "/sounds/success-notif.wav"
      : "/sounds/mixkit-game-show-wrong-answer-buzz-950.wav", // Use same sound for error for now
  );

  // Lower the volume slightly so it's not jarring
  audio.volume = 0.6;

  audio.play().catch((err) => {
    // Browsers sometimes block audio if the user hasn't interacted with the page yet
    console.warn("Sound playback blocked until user interaction:", err);
  });
};
