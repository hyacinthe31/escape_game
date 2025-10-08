"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-5xl font-bold mb-8 text-cyan-400 drop-shadow-md">
        🧠 Dans le corps humain
      </h1>

      <p className="text-gray-400 mb-12 max-w-md">
        Entrez dans le corps humain et coopérez à deux pour sauver le patient.  
        Le temps est compté !
      </p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push("/lobby")}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-semibold transition-all cursor-pointer"
        >
          🎮 Jouer
        </button>

        <button
          onClick={() => router.push("/scoreboard")}
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-lg font-semibold transition-all cursor-pointer"
        >
          🏆 Voir le classement
        </button>
      </div>

      <footer className="absolute bottom-6 text-gray-600 text-sm">
        © {new Date().getFullYear()} Dans le corps humain
      </footer>
    </main>
  );
}

