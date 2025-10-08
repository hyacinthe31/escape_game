"use client";
import { useEffect, useState } from "react";

export default function GameTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🧩 Sauvegarde en continu pour le récupérer plus tard
  useEffect(() => {
    localStorage.setItem("totalTime", String(seconds));
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded">
      ⏱️ {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}

