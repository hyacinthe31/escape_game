"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultPage() {
  const params = useSearchParams();
  const router = useRouter();

  const pseudo = params.get("pseudo") || "Anonyme";
  const time = params.get("time") || "0";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">🏁 Résultats finaux</h1>
      <p className="text-xl mb-4">
        <b>{pseudo}</b>, ton temps final est :
      </p>
      <p className="text-5xl text-green-400 mb-8">{time}s</p>

      <button
        onClick={() => router.push("/scoreboard")}
        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl transition cursor-pointer"
      >
        Voir le classement 🏆
      </button>

      <button
        onClick={() => router.push("/lobby")}
        className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded cursor-pointer"
      >
        Rejouer 🔁
      </button>
    </main>
  );
}
