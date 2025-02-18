import { useState } from "react";
import { VoiceInterface } from "@/components/voice-interface";
import { CodeDisplay } from "@/components/code-display";
import { ImageDisplay } from "@/components/image-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll } from "lucide-react";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState<{
    text: string;
    type: "code" | "image" | "text";
    codeSnippet?: string;
    language?: string;
    imageUrl?: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Nuvem Treinamentos
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered learning assistant for programming and English
          </p>
        </div>

        <VoiceInterface
          onTranscript={setTranscript}
          onResponse={(res) => setResponse(JSON.parse(res))}
        />

        {transcript && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Scroll className="h-5 w-5" />
              <CardTitle className="text-lg">Your Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{transcript}</p>
            </CardContent>
          </Card>
        )}

        {response && (
          <>
            {response.type === "code" && response.codeSnippet && (
              <CodeDisplay
                code={response.codeSnippet}
                language={response.language || "text"}
              />
            )}
            {response.type === "image" && response.imageUrl && (
              <ImageDisplay
                imageUrl={response.imageUrl}
                alt="AI generated visual explanation"
              />
            )}
            {response.type === "text" && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">{response.text}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
