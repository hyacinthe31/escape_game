"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";

type Cell = 0 | 1;
type Grid = Cell[][];
type Pos = { x: number; y: number };
type Obstruction = { id: string; x: number; y: number };

export default function LungsObstructionPuzzle({ onSolve }: { onSolve: () => void }) {
  const socket = getSocket();

  // état réseau
  const [role, setRole] = useState<string | null>(null);
  const [players, setPlayers] = useState(0);

  // carte
  const [grid, setGrid] = useState<Grid>([]);
  const [start, setStart] = useState<Pos | null>(null);
  const [techPos, setTechPos] = useState<Pos | null>(null);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [cleared, setCleared] = useState<string[]>([]);
  const [clearing, setClearing] = useState<{ id: string; progress?: number } | null>(null);

  const [solved, setSolved] = useState(false);
  const holdingRef = useRef(false);

  // taille d’une cellule pour l’affichage
  const CELL = 24; // px

  // wiring socket
  useEffect(() => {
    socket.emit("join_room", "patient-1");

    const onRole = (r: string) => setRole(r);
    const onJoined = ({ players }: { players: number }) => setPlayers(players);

    socket.on("role_assigned", onRole);
    socket.on("player_joined", onJoined);
    socket.on("player_left", (remaining: number) => setPlayers(remaining));

    socket.on("lungs3_bootstrap", (data: any) => {
      setGrid(data.grid);
      setStart(data.start);
      setTechPos(data.techPos);
      setObstructions(data.obstructions);
      setCleared(data.cleared);
      setClearing(data.clearing);
    });

    socket.on("lungs3_state", (data: any) => {
    // même si cleared n’a pas “changé” côté serveur, on le réapplique
    if (data.techPos) setTechPos(data.techPos);
    if (data.cleared !== undefined) {
        setCleared(Array.isArray(data.cleared) ? data.cleared : []);
    }
    setClearing(data.clearing || null);
    });


    socket.on("lungs3_solved", () => {
      setSolved(true);
      onSolve();
    });

    // init étape
    socket.emit("lungs3_init", "patient-1");

    return () => {
      socket.off("role_assigned", onRole);
      socket.off("player_joined", onJoined);
      socket.off("player_left");
      socket.off("lungs3_bootstrap");
      socket.off("lungs3_state");
      socket.off("lungs3_solved");
    };
  }, [socket, onSolve]);

  // contrôles clavier (TECH)
    useEffect(() => {
    if (role !== "tech" || solved) return;
    let interval: NodeJS.Timeout | null = null;

    const sendHold = (state: boolean) => {
        socket.emit("lungs3_hold", { room: "patient-1", holding: state });
    };

    const down = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const key = e.key.toLowerCase();

        if (["arrowup", "z"].includes(key)) socket.emit("lungs3_move", { room: "patient-1", dir: "up" });
        else if (["arrowdown", "s"].includes(key)) socket.emit("lungs3_move", { room: "patient-1", dir: "down" });
        else if (["arrowleft", "q"].includes(key)) socket.emit("lungs3_move", { room: "patient-1", dir: "left" });
        else if (["arrowright", "d"].includes(key)) socket.emit("lungs3_move", { room: "patient-1", dir: "right" });

        if (key === " ") {
        e.preventDefault();
        if (interval) clearInterval(interval);
        sendHold(true);
        interval = setInterval(() => sendHold(true), 200); // <– on renvoie "holding:true" 5×/s
        }
    };

    const up = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === " ") {
        if (interval) clearInterval(interval);
        interval = null;
        sendHold(false);
        }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        if (interval) clearInterval(interval);
        sendHold(false);
    };
    }, [role, solved, socket]);


  if (!role) {
    return <div className="flex h-[300px] items-center justify-center"><p className="text-gray-400 animate-pulse">Chargement du rôle…</p></div>;
  }
  if (players < 2) {
    return <div className="flex h-[300px] items-center justify-center"><p className="text-blue-400 animate-pulse">🕒 En attente du deuxième joueur…</p></div>;
  }
  if (!grid.length || !techPos) {
    return <div className="flex h-[300px] items-center justify-center"><p className="text-gray-400">Initialisation du poumon…</p></div>;
  }

  // Rendu de la grille
  const W = grid[0].length * CELL;
  const H = grid.length * CELL;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Explications par rôle */}
      {role === "medic" ? (
        <p className="max-w-xl text-gray-300">
          Vous voyez les zones obstruées <span className="text-red-400">en rouge</span>. 
          Guidez la sonde (cyan) jusqu’à chaque zone puis demandez au technicien de maintenir <kbd>Espace</kbd> pour déboucher.
        </p>
      ) : (
        <p className="max-w-xl text-gray-300">
          Déplacez la sonde avec <kbd>ZQSD</kbd>/<kbd>Flèches</kbd>. 
          Quand vous êtes sur une obstruction, maintenez <kbd>Espace</kbd> pour l’aspirer (1,5 s).
        </p>
      )}

      <div className="relative" style={{ width: W, height: H }}>
        {/* fond */}
        <div className="absolute inset-0 bg-cyan-950/60 rounded-md border border-cyan-800" />

        {/* murs */}
        {grid.map((row, y) =>
          row.map((c, x) =>
            c === 1 ? (
              <div
                key={`w-${x}-${y}`}
                className="absolute bg-slate-800"
                style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL }}
              />
            ) : null
          )
        )}

        {/* obstructions (médecin seulement) */}
        {role === "medic" &&
          obstructions.map((o) => {
            const isCleared = cleared.includes(o.id);
            return (
              <div
                key={o.id}
                className={`absolute rounded-full ${isCleared ? "bg-green-500/70" : "bg-red-500/80"} ring-2 ring-white/20`}
                style={{
                  left: o.x * CELL + CELL * 0.15,
                  top: o.y * CELL + CELL * 0.15,
                  width: CELL * 0.7,
                  height: CELL * 0.7,
                }}
                title={isCleared ? `Obstruction ${o.id} débouchée` : `Obstruction ${o.id}`}
              />
            );
          })}

        {/* sonde (tech position) */}
        <motion.div
          className="absolute rounded-md bg-cyan-400 shadow-lg shadow-cyan-500/30"
          style={{
            left: techPos.x * CELL + 4,
            top: techPos.y * CELL + 4,
            width: CELL - 8,
            height: CELL - 8,
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />

        {/* anneau de progression pendant le maintien (visible aux deux) */}
        {clearing && (() => {
          const ob = obstructions.find(o => o.id === clearing.id);
          if (!ob) return null;
          const pct = Math.round((clearing.progress ?? 0) * 100);
          return (
            <div
              className="absolute rounded-full border-2 border-pink-400"
              style={{
                left: ob.x * CELL + 2,
                top: ob.y * CELL + 2,
                width: CELL - 4,
                height: CELL - 4,
                boxShadow: "0 0 16px rgba(244,114,182,0.4)",
              }}
              title={`Nettoyage ${pct}%`}
            />
          );
        })()}

        {/* badges “cleared” visibles aux deux */}
        {obstructions.map(o => {
          if (!cleared.includes(o.id)) return null;
          return (
            <div
              key={`c-${o.id}`}
              className="absolute text-green-300 text-xs font-semibold"
              style={{ left: o.x * CELL + 2, top: o.y * CELL + 2 }}
            >
              ✔
            </div>
          );
        })}
      </div>

      {solved ? (
        <div className="text-green-400 font-semibold">✅ Poumon débouché !</div>
      ) : (
        <div className="text-gray-400 text-sm">
          Zones restantes :{" "}
          <span className="font-semibold">
            {obstructions.filter(o => !cleared.includes(o.id)).map(o => o.id).join(" · ") || "—"}
          </span>
        </div>
      )}
    </div>
  );
}



