import { BrainCircuit } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Processando sua pergunta...
      </p>
    </div>
  );
}
