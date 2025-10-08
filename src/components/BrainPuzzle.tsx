"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";

type Point = { id: number; x: number; y: number };
type Connection = { from: number; to: number };

const correctConnections: Connection[] = [
  { from: 2, to: 8 },
  { from: 4, to: 11 },
  { from: 10, to: 15 },
];

export default function BrainPuzzle({ onSolve }: { onSolve: () => void }) {
  const socket = getSocket();
  const [neurons, setNeurons] = useState<Point[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [activated, setActivated] = useState<Connection[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [players, setPlayers] = useState<number>(0);

  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    socket.emit("join_room", "patient-1");

    socket.on("role_assigned", (r) => setRole(r));
    socket.on("player_joined", ({ players }) => setPlayers(players));
    socket.on("player_left", (remaining) => setPlayers(remaining));

    socket.on("neurons_data", (serverNeurons) => {
      setNeurons(serverNeurons); // 🔥 synchronisation totale
    });

    socket.on("update_state", (data) => {
      if (data.type === "connect_neuron") {
        const { from, to } = data.value;
        validateConnection(from, to, false);
      }
    });

    return () => {
      socket.off("role_assigned");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("neurons_data");
      socket.off("update_state");
    };
  }, []);

  const isGameCompleted = correctConnections.every((c) =>
    activated.some(
      (a) =>
        (a.from === c.from && a.to === c.to) ||
        (a.from === c.to && a.to === c.from)
    )
  );

  useEffect(() => {
    if (isGameCompleted) {
      onSolve(); // 🔥 informe Mission que le puzzle est fini
    }
  }, [isGameCompleted, onSolve]);

  const validateConnection = (from: number, to: number, emit = true) => {
    const match = correctConnections.find(
      (c) =>
        (c.from === from && c.to === to) ||
        (c.from === to && c.to === from)
    );

    if (emit) {
      socket.emit("action", {
        room: "patient-1",
        type: "connect_neuron",
        value: { from, to },
      });
    }

    if (match) {
      // Vérifie que la connexion n'est pas déjà validée
      const alreadyDone = activated.some(
        (a) =>
          (a.from === from && a.to === to) ||
          (a.from === to && a.to === from)
      );

      if (!alreadyDone) {
        setActivated((prev) => [...prev, match]);
        setFeedback("✅ Bonne connexion !");
      } else {
        setFeedback("⚡ Connexion déjà activée !");
      }
    } else {
      setFeedback("❌ Mauvaise connexion !");
      socket.emit("penalty_add", 5);
    }
    setTimeout(() => setFeedback(null), 1000);
  };

  // début de drag
  const handleMouseDown = (n: Point) => {
    if (role !== "tech") return;
    setDragStart(n);
    setDragEnd(null);
  };

  // déplacement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || role !== "tech" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragEnd({ x, y });
  };

  // relâchement
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart || role !== "tech" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = neurons.find(
      (n) => Math.hypot(n.x - x, n.y - y) < 20 && n.id !== dragStart.id
    );
    if (target) validateConnection(dragStart.id, target.id, true);
    setDragStart(null);
    setDragEnd(null);
  };

  if (players < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <motion.p
          className="text-lg text-cyan-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🕒 En attente du deuxième joueur...
        </motion.p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2">🧠 Connexions neuronales</h2>
      <p className="text-gray-400 mb-4">
        {role === "medic"
          ? "Observe les bonnes connexions et guide ton coéquipier."
          : "Clique et glisse pour connecter deux neurones."}
      </p>

      <div
        ref={containerRef}
        className="relative w-[600px] h-[400px] border border-cyan-700 rounded-lg bg-cyan-950 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* SVG calqué pour les lignes */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* connexions correctes visibles par le médecin */}
          {role === "medic" &&
            correctConnections.map((conn, i) => {
              const from = neurons.find((n) => n.id === conn.from);
              const to = neurons.find((n) => n.id === conn.to);
              if (!from || !to) return null;
              return (
                <line
                  key={`correct-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="gray"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
              );
            })}

          {/* connexions activées */}
          {activated.map((conn, i) => {
            const from = neurons.find((n) => n.id === conn.from);
            const to = neurons.find((n) => n.id === conn.to);
            if (!from || !to) return null;
            return (
              <line
                key={`active-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="cyan"
                strokeWidth="3"
              />
            );
          })}

          {/* ligne temporaire */}
          {dragStart && dragEnd && (
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragEnd.x}
              y2={dragEnd.y}
              stroke="pink"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Neurones (tous roses) */}
        {neurons.map((n) => (
          <motion.div
            key={n.id}
            onMouseDown={() => handleMouseDown(n)}
            className="absolute w-5 h-5 rounded-full bg-pink-500 cursor-pointer"
            style={{ top: n.y - 10, left: n.x - 10 }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {feedback && (
        <motion.p
          className={`mt-4 text-lg ${
            feedback.includes("❌") ? "text-red-400" : "text-green-400"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {feedback}
        </motion.p>
      )}
      {!feedback && (
        <p className="mt-4 text-gray-400 italic">Fais une connexion...</p>
      )}
    </div>
  );
}




