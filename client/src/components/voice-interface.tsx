import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Speaker, StopCircle } from "lucide-react";
import { audioRecorder } from "@/lib/audio-recorder";
import { speechHandler } from "@/lib/speech";
import { useToast } from "@/hooks/use-toast";
import { LoadingIndicator } from "./loading-indicator";

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void;
  onResponse: (response: string) => void;
}

export function VoiceInterface({ onTranscript, onResponse }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      const transcript = await speechHandler.startListening();
      setIsRecording(false);
      setIsProcessing(true);

      onTranscript(transcript);

      // Start the API request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: transcript })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const result = await response.json();

      // Start speaking immediately after getting the response
      speechHandler.speak(result.aiResponse).catch((error) => {
        console.error("Error in speech:", error);
        toast({
          title: "Erro na fala",
          description: "Não foi possível reproduzir a resposta em áudio",
          variant: "destructive"
        });
      });

      // Update the UI with the full response after starting speech
      onResponse(JSON.stringify(result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopRecording = () => {
    speechHandler.stopListening();
    setIsRecording(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <Speaker className="mr-2 h-4 w-4" />
                Processando...
              </>
            ) : isRecording ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Parar Gravação
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Iniciar Gravação
              </>
            )}
          </Button>
          {isRecording && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Ouvindo... Fale agora
            </p>
          )}
          {isProcessing && <LoadingIndicator />}
        </div>
      </CardContent>
    </Card>
  );
}