"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const BrainPuzzle = dynamic(() => import("@/components/BrainPuzzle"), { ssr: false });
const HeartPuzzle = dynamic(() => import("@/components/HeartPuzzle"), { ssr: false });
const LungsPuzzle = dynamic(() => import("@/components/LungsPuzzle"), { ssr: false });
const GameTimer = dynamic(() => import("@/components/GameTimer"), { ssr: false });
// import BrainPuzzle from "@/components/BrainPuzzle";
// import HeartPuzzle from "@/components/HeartPuzzle";
// import LungsPuzzle from "@/components/LungsPuzzle";
// import GameTimer from "@/components/GameTimer";


export default function Mission() {
  // Liste des étapes (organes)
  const [currentOrgan, setCurrentOrgan] = useState<"brain" | "heart" | "lungs">("brain");
  const [solved, setSolved] = useState(false);

  const handleSolve = () => {
    setSolved(true);

    // Passage automatique à l’étape suivante
    setTimeout(() => {
      if (currentOrgan === "brain") setCurrentOrgan("heart");
      else if (currentOrgan === "heart") setCurrentOrgan("lungs");
      else if (currentOrgan === "lungs") alert("✅ Mission terminée !");
      setSolved(false);
    }, 1000);
  };

  return (
    <>
      <GameTimer />
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">🧠 Inside the Human Body</h1>

        {currentOrgan === "brain" && (
          <>
            <h2 className="text-2xl mb-4 text-cyan-400">Phase 1 : Cerveau</h2>
            <BrainPuzzle onSolve={() => setSolved(true)} />
          </>
        )}

        {currentOrgan === "heart" && (
          <>
            <h2 className="text-2xl text-red-500">Phase 2 : le cœur</h2>
            <HeartPuzzle onSolve={() => setSolved(true)} />
          </>
        )}

        {currentOrgan === "lungs" && (
          <>
            <h2 className="text-2xl text-blue-400">Phase 3 : les poumons</h2>
            <LungsPuzzle onSolve={() => setSolved(true)} />
          </>
        )}

        <div className="mt-8">
          {solved && (
            <button
              onClick={handleSolve}
              className="px-4 py-2 bg-cyan-600 rounded-xl hover:bg-cyan-700 transition cursor-pointer"
            >
              Passer à l'étape suivante
            </button>
          )}
          {!solved && (
            <p className="text-gray-500 italic">Résous l'étape pour continuer...</p>
          )}
        </div>

      </main>
    </>
  );
}



