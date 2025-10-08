import { Suspense } from "react";
import ResultContent from "./result-content";

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="text-center mt-20 text-white">Chargement des résultats...</p>}>
      <ResultContent />
    </Suspense>
  );
}

