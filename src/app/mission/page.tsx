"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const BrainPuzzle = dynamic(() => import("@/components/BrainPuzzle"), { ssr: false });
const HeartPuzzle = dynamic(() => import("@/components/HeartPuzzle"), { ssr: false });
const LungsPuzzle = dynamic(() => import("@/components/LungsPuzzle"), { ssr: false });
const GameTimer = dynamic(() => import("@/components/GameTimer"), { ssr: false });


export default function Mission() {
  const router = useRouter();
  const [currentOrgan, setCurrentOrgan] = useState<"brain" | "heart" | "lungs">("brain");
  const [solved, setSolved] = useState(false);
  const [isFinalStage, setIsFinalStage] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    localStorage.removeItem("scoreSent");
  }, []);


  const handleSolve = () => {
    setSolved(true);
    setTimeout(() => {
      if (currentOrgan === "brain") setCurrentOrgan("heart");
      else if (currentOrgan === "heart") setCurrentOrgan("lungs");
      else if (currentOrgan === "lungs") {
        // ✅ Fin de toutes les étapes
        setTimerRunning(false);
        setIsFinalStage(true);
      }
      setSolved(false);
    }, 1000);
  };

  const handleSendScore = async () => {
    const alreadySent = localStorage.getItem("scoreSent");
    if (alreadySent) {
      console.log("⏩ Score déjà envoyé, on ignore.");
      router.push(`/result?pseudo=${encodeURIComponent(localStorage.getItem("playerPseudo") || "Anonyme")}&time=${localStorage.getItem("totalTime") || "0"}`);
      return;
    }

    const pseudo = localStorage.getItem("playerPseudo") || "Anonyme";
    const time = parseInt(localStorage.getItem("totalTime") || "0", 10);

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, time }),
      });

      if (res.ok) {
        localStorage.setItem("scoreSent", "true");
        router.push(`/result?pseudo=${encodeURIComponent(pseudo)}&time=${time}`);
      } else {
        alert("⚠️ Erreur lors de l'enregistrement du score.");
      }
    } catch (err) {
      console.error("Erreur POST score :", err);
    }
  };

  return (
    <>
      <GameTimer/>
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">🧠 Dans le corps humain</h1>

        {!isFinalStage && (
          <>
            {currentOrgan === "brain" && (
              <>
                <h2 className="text-2xl mb-4 text-cyan-400">Phase 1 : Cerveau</h2>
                <BrainPuzzle onSolve={handleSolve} />
              </>
            )}

            {currentOrgan === "heart" && (
              <>
                <h2 className="text-2xl text-red-500">Phase 2 : Cœur</h2>
                <HeartPuzzle onSolve={handleSolve} />
              </>
            )}

            {currentOrgan === "lungs" && (
              <>
                <h2 className="text-2xl text-blue-400">Phase 3 : Poumons</h2>
                <LungsPuzzle onSolve={handleSolve} />
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
                <p className="text-gray-400 italic">
                  Résous l'étape pour continuer...
                </p>
              )}
            </div>
          </>
        )}

        {isFinalStage && (
          <div className="mt-10 flex flex-col items-center">
            <h2 className="text-3xl text-green-400 mb-6">
              ✅ Mission terminée !
            </h2>
            <button
              onClick={handleSendScore}
              className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700 transition cursor-pointer"
            >
              Voir le résultat
            </button>
          </div>
        )}
      </main>
    </>
  );
}



