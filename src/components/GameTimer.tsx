"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export default function GameTimer() {
  const socket = getSocket();
  const [time, setTime] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    socket.on("timer_update", (elapsed) => setTime(elapsed));
    socket.on("timer_penalty", (sec) => {
      setTime((prev) => prev + sec);
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    });
    socket.on("timer_stop", (finalTime) => {
      setTime(finalTime);
      localStorage.setItem("totalTime", String(finalTime));
    });

    return () => {
      socket.off("timer_update");
      socket.off("timer_penalty");
      socket.off("timer_stop");
    };
  }, [socket]);

  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <div
      className={`absolute top-4 right-4 px-4 py-2 rounded text-white font-mono transition-all duration-300 ${
        flash ? "bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.8)] scale-110" : "bg-black/60"
      }`}
    >
      ⏱️ {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}


