import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Speaker } from "lucide-react";
import { audioRecorder } from "@/lib/audio-recorder";
import { speechHandler } from "@/lib/speech";
import { useToast } from "@/hooks/use-toast";

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
      await audioRecorder.startRecording();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording: " + error.message,
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      const transcript = await speechHandler.startListening();
      onTranscript(transcript);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: transcript })
      });

      const result = await response.json();
      onResponse(result.aiResponse);
      await speechHandler.speak(result.aiResponse);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process audio: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <>
                <Speaker className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
