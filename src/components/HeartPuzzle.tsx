"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";

export default function HeartPuzzle({ onSolve }: { onSolve: () => void }) {
  // --- Hooks (tous en haut !) ---
  const socket = getSocket();
  const [role, setRole] = useState<string | null>(null);
  const [players, setPlayers] = useState(0);

  // Médecin : BPM cible ; Tech : BPM choisi
  const [bpmTarget, setBpmTarget] = useState<number | null>(null);
  const [bpmTech, setBpmTech] = useState<number>(60);

  const [isSolved, setIsSolved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // --- Connexion room + rôles + événements socket ---
  useEffect(() => {
    socket.emit("join_room", "patient-1");

    const onRole = (r: string) => setRole(r);
    const onJoined = ({ players }: { players: number }) => setPlayers(players);

    socket.on("role_assigned", onRole);
    socket.on("player_joined", onJoined);
    socket.on("player_left", (remaining: number) => setPlayers(remaining));

    // Médecin reçoit la cible du serveur
    socket.on("heart_target", (target: number) => setBpmTarget(target));
    socket.on("heart_solved", () => {
      setIsSolved(true);
      setMsg("✅ Rythme correct !");
      onSolve();
    });
    socket.on("heart_wrong", () => {
      socket.emit("penalty_add", 2);
      setMsg("❌ Mauvaise valeur");
      setTimeout(() => setMsg(null), 800);
    });

    return () => {
      socket.off("role_assigned", onRole);
      socket.off("player_joined", onJoined);
      socket.off("player_left");
      socket.off("heart_target");
      socket.off("heart_solved");
      socket.off("heart_wrong");
    };
  }, [socket, onSolve]);

  // Dès que le rôle du médecin est connu, il demande la cible
  useEffect(() => {
    if (role === "medic") {
      socket.emit("heart_init", "patient-1");
    }
  }, [role, socket]);

  // --- Contrôles Tech (±1) ---
  const inc = () => {
    if (role !== "tech" || isSolved) return;
    setBpmTech((b) => Math.min(180, b + 1));
  };
  const dec = () => {
    if (role !== "tech" || isSolved) return;
    setBpmTech((b) => Math.max(30, b - 1));
  };
  const validate = () => {
    if (role !== "tech" || isSolved) return;
    socket.emit("heart_validate", { room: "patient-1", bpm: bpmTech });
  };

  // --- ECG réaliste (médecin uniquement) ---
  const [ecgPoints, setEcgPoints] = useState<string>("");
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0); // 0..1

  // Gaussienne utilitaire
  const gauss = (x: number, mu: number, sigma: number, amp: number) =>
    amp * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

  // Onde ECG P-QRS-T (phase 0..1 -> amplitude pixels)
  const ecgWave = (phase: number) => {
    // baseline
    let y = 0;
    // P (~0.2)
    y += gauss(phase, 0.18, 0.03, 8);
    // Q (~0.38) nég
    y += gauss(phase, 0.38, 0.01, -18);
    // R (~0.40) pic pos
    y += gauss(phase, 0.40, 0.006, 55);
    // S (~0.43) nég
    y += gauss(phase, 0.43, 0.012, -20);
    // T (~0.70) pos
    y += gauss(phase, 0.70, 0.05, 14);
    return y;
  };

  useEffect(() => {
    if (role !== "medic" || bpmTarget == null) return;

    const W = 600;          // largeur svg
    const H = 200;          // hauteur svg
    const base = H / 2 + 10; // ligne isoélectrique décalée
    const period = 60 / bpmTarget; // secondes par battement

    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      // avance la phase selon le temps
      phaseRef.current = (phaseRef.current + dt / period) % 1;

      // génère les points visibles (scroll horizontal simulé par phase)
      const pts: string[] = [];
      const step = 3; // pixels
      for (let x = 0; x <= W; x += step) {
        const phase = (phaseRef.current + x / W) % 1;
        const amp = ecgWave(phase); // amplitude en px
        const y = base - amp;
        pts.push(`${x},${y}`);
      }
      setEcgPoints(pts.join(" "));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [role, bpmTarget]);

  // --- UI ---

  if (!role) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-gray-400 animate-pulse">Chargement du rôle…</p>
      </div>
    );
  }

  if (players < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-red-400 animate-pulse">🕒 En attente du deuxième joueur…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {role === "medic" && (
        <p className="max-w-xl text-center text-gray-300 leading-relaxed mb-2">
          Vous percevez le rythme irrégulier du cœur du patient. 
          Observez l’ECG et indiquez au technicien quand le rythme semble correct.
        </p>
      )}

      {role === "tech" && (
        <p className="max-w-xl text-center text-gray-300 leading-relaxed mb-2">
          Le cœur du patient bat de façon instable. 
          Ajustez la fréquence cardiaque pour synchroniser le rythme avec celui du médecin.
        </p>
      )}


      {/* Médecin : ECG + BPM cible affiché (tech ne le voit pas) */}
      {role === "medic" && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-[600px] h-[200px] bg-black border border-red-700 rounded-md overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 200">
              {/* grille légère */}
              <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50} x2={i * 50} y1={0} y2={200} />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`h${i}`} y1={i * 25} y2={i * 25} x1={0} x2={600} />
                ))}
              </g>
              {/* courbe ECG */}
              <polyline
                points={ecgPoints}
                fill="none"
                stroke="#ff3b3b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Technicien : contrôle au pas de 1 + validation */}
      {role === "tech" && (
        <div className="flex flex-col items-center gap-4">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isSolved ? "bg-green-600" : "bg-red-600"}`}>
            {bpmTech}
          </div>
          <div className="flex gap-3">
            <button onClick={dec} disabled={isSolved} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50">–</button>
            <button onClick={inc} disabled={isSolved} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50">+</button>
          </div>
          <button
            onClick={validate}
            disabled={isSolved}
            className={`mt-2 px-5 py-2 rounded-lg cursor-pointer text-white font-semibold ${isSolved ? "bg-green-600 cursor-default" : "bg-cyan-600 hover:bg-cyan-700"}`}
          >
            {isSolved ? "✅ Validé" : "Valider"}
          </button>
          {msg && <p className="text-sm mt-1 text-gray-300">{msg}</p>}
        </div>
      )}
    </div>
  );
}


