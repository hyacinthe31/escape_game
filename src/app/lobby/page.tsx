"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

export default function Lobby() {
  const [role, setRole] = useState<string | null>(null);
  const [players, setPlayers] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // ✅ initialise le socket uniquement côté client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = getSocket();
    setSocket(s);
    setSocketReady(true);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("medic_pseudo", (pseudo: string) => {
      setPseudo(pseudo);
    });
    return () => socket.off("medic_pseudo");
  }, [socket]);


  useEffect(() => {
    if (!socketReady || !socket) return;

    socket.emit("join_room", "patient-1");

    socket.on("role_assigned", (r: string) => {
      setRole(r);
      localStorage.setItem("playerRole", r);
      if (r === "medic") {
        const saved = localStorage.getItem("playerPseudo");
        if (saved) setPseudo(saved);
      }
    });

    socket.on("player_joined", (data: any) => setPlayers(data.players));

    return () => {
      socket.off("role_assigned");
      socket.off("player_joined");
    };
  }, [socketReady, socket]);

  const handleSavePseudo = () => {
    if (!pseudo.trim()) return alert("Choisis un pseudo avant de continuer !");
    localStorage.setItem("playerPseudo", pseudo.trim());
    socket?.emit("pseudo_chosen", { pseudo }); // 💡 nouveau event envoyé au tech
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-4xl font-bold mb-4">🧠 Inside the Human Body</h1>
      <p className="text-gray-400 mb-4">Joueurs connectés : {players}</p>

      {!role && <p>En attente du rôle...</p>}

      {role === "tech" && (
        <>
          <p className="text-cyan-400 text-2xl mb-4">Tu es le technicien 🧰</p>
          <p className="text-gray-400 mb-6">
            En attente du pseudo du médecin...
          </p>

          <div className="mt-6">
            {pseudo ? (
              <>
                <p className="text-green-400 mb-4">
                  Le médecin est prêt : <b>{pseudo}</b>
                </p>
                <Link
                  href="/mission"
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition cursor-pointer"
                >
                  Démarrer la mission 🚀
                </Link>
              </>
            ) : (
              <p className="text-gray-500 italic">Le médecin n’a pas encore choisi son pseudo.</p>
            )}
          </div>
        </>
      )}

      {role === "medic" && (
        <>
          <p className="text-red-400 text-2xl mb-4">Tu es le médecin 🩺</p>
          <label className="mb-2 block text-lg">Choisis ton pseudo :</label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Votre pseudo"
            className="text-black px-3 py-2 rounded mb-4"
          />
          <button
            onClick={handleSavePseudo}
            className="bg-cyan-600 hover:bg-cyan-700 transition px-4 py-2 rounded cursor-pointer"
          >
            Enregistrer le pseudo
          </button>

          <div className="mt-8">
            <Link
              href="/mission"
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition cursor-pointer"
            >
              Démarrer la mission 🚀
            </Link>
          </div>
        </>
      )}
    </main>
  );
}


