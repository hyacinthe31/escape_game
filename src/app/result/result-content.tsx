"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();

  const pseudo = params.get("pseudo") || "Anonyme";
  const time = params.get("time") || "0";

  const organInfo = [
    {
      title: "🧠 Le Cerveau",
      text: "Il renferme près de 86 milliards de neurones. Véritable centre de commande, il coordonne nos pensées, nos émotions et chacun de nos mouvements.",
      color: "text-cyan-400",
    },
    {
      title: "❤️ Le Cœur",
      text: "Il bat environ 100 000 fois par jour et pompe 5 litres de sang chaque minute. Il alimente chaque cellule en oxygène et nutriments.",
      color: "text-red-400",
    },
    {
      title: "🫁 Les Poumons",
      text: "Ils assurent l’échange vital entre l’air et le sang, absorbant l’oxygène et rejetant le dioxyde de carbone, pour maintenir ton corps en vie.",
      color: "text-blue-400",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-black text-white">
      <h1 className="text-4xl font-bold mb-6 text-cyan-300">🏁 Résultats finaux</h1>

      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg max-w-md w-full text-center mb-8">
        <p className="text-lg mb-2">
          Joueur : <span className="font-semibold">{pseudo}</span>
        </p>
        <p className="text-lg">
          Temps total :{" "}
          <span className="font-semibold text-cyan-400">{time}s</span>
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-cyan-400">
        🧠 Ce que vous avez découvert
      </h2>

      <div className="grid gap-6 max-w-2xl">
        {organInfo.map((org, i) => (
          <div
            key={i}
            className="bg-gray-800/70 rounded-xl p-5 shadow-md hover:scale-[1.02] transition-transform"
          >
            <h3 className={`text-xl font-bold mb-2 ${org.color}`}>{org.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{org.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 items-center">
        <button
          onClick={() => router.push("/scoreboard")}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl transition"
        >
          Voir le classement 🏆
        </button>

        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
        >
          Rejouer 🔁
        </button>
      </div>
    </main>
  );
}

