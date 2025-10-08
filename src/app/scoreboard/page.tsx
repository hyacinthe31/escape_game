"use client";
import { useEffect, useState } from "react";

export default function Scoreboard() {
  const [scores, setScores] = useState<{ pseudo: string; time: number }[]>([]);

  useEffect(() => {
    fetch("/api/score")
      .then((res) => res.json())
      .then((data) => setScores(data.scores || []))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl mb-8 font-bold">🏆 Classement général</h1>

      <ul className="space-y-3 text-lg">
        {scores.map((s, i) => (
          <li key={i} className="bg-gray-800 px-6 py-3 text-white rounded-lg w-64 text-left">
            <span className="text-cyan-400 font-bold">{i + 1}.</span>{" "}
            {s.pseudo} — <b>{s.time}s</b>
          </li>
        ))}
      </ul>

      <button
        onClick={() => location.href = "/"}
        className="mt-10 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition cursor-pointer"
      >
        Revenir à l'accueil
      </button>
    </main>
  );
}

