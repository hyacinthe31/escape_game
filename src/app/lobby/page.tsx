"use client";
import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

export default function Lobby() {
  const [role, setRole] = useState<string | null>(null);
  const [players, setPlayers] = useState(0);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    setSocket(socket);
    socket.emit("join_room", "patient-1");

    socket.on("role_assigned", (r) => setRole(r));
    socket.on("player_joined", (data) => setPlayers(data.players));

    return () => {
      socket.off("role_assigned");
      socket.off("player_joined");
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Salle d’attente</h1>
      <p className="mt-4">Joueurs connectés : {players}</p>

      {role ? (
        <div className="mt-6 text-center">
          <p className="text-lg">Ton rôle : <span className="font-bold">{role}</span></p>
          {players >= 2 ? (
            <Link
              href="/mission"
              className="mt-6 inline-block bg-cyan-600 px-4 py-2 rounded-xl hover:bg-cyan-700"
            >
              Commencer la mission
            </Link>
          ) : (
            <p className="mt-4 text-gray-400">En attente du deuxième joueur...</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-gray-400">Attribution du rôle en cours...</p>
      )}
    </main>
  );
}
