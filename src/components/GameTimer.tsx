"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export default function GameTimer() {
  const socket = getSocket();
  const [elapsed, setElapsed] = useState(0);
  const [penalty, setPenalty] = useState<number | null>(null);

  useEffect(() => {
    socket.on("timer_update", (sec: number) => setElapsed(sec));
    socket.on("timer_stop", (finalSec: number) => setElapsed(finalSec));
    socket.on("timer_penalty", (sec: number) => {
      setPenalty(sec);
      setTimeout(() => setPenalty(null), 2000);
    });
    return () => {
      socket.off("timer_update");
      socket.off("timer_stop");
      socket.off("timer_penalty");
    };
  }, [socket]);

  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="fixed top-4 right-4 bg-cyan-900/70 text-cyan-300 px-4 py-2 rounded-lg shadow-md font-mono text-lg">
      ⏱️ {minutes}:{seconds}
      {penalty && (
        <span className="ml-2 text-red-400 font-bold animate-pulse">
          +{penalty}s
        </span>
      )}
    </div>
  );
}
