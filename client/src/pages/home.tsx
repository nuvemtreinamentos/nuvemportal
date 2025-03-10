import { useState, useEffect } from "react";
import { VoiceInterface } from "@/components/voice-interface";
import { CodeDisplay } from "@/components/code-display";
import { ImageDisplay } from "@/components/image-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll } from "lucide-react";
import { WelcomeScreen } from "@/components/welcome-screen";
import { LearningHeatmap } from "@/components/learning-heatmap";
import { CourseSelection } from "@/components/course-selection";
import { useLocation } from "wouter";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [, setLocation] = useLocation();
  const [response, setResponse] = useState<{
    id: number;
    userInput: string;
    aiResponse: string;
    metadata: {
      type: "code" | "image" | "text";
      codeSnippet?: string;
      language?: string;
      imageUrl?: string;
    };
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleCourseSelect = (courseId: string) => {
    // Navigate to the course page when a course is selected
    setLocation(`/course/${courseId}`);
  };

  return (
    <>
      {showWelcome && <WelcomeScreen />}
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Your Course</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseSelection onSelect={handleCourseSelect} />
            </CardContent>
          </Card>

          <LearningHeatmap />

          <VoiceInterface
            onTranscript={setTranscript}
            onResponse={(res) => {
              console.log('Raw response from voice interface:', res);
              try {
                const parsedResponse = JSON.parse(res);
                console.log('Parsed response:', parsedResponse);
                setResponse(parsedResponse);
              } catch (error) {
                console.error('Error parsing response:', error);
              }
            }}
          />

          {transcript && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Scroll className="h-5 w-5" />
                <CardTitle className="text-lg">Sua Pergunta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{transcript}</p>
              </CardContent>
            </Card>
          )}

          {response && (
            <>
              {response.metadata.type === "code" && response.metadata.codeSnippet && (
                <CodeDisplay
                  code={response.metadata.codeSnippet}
                  language={response.metadata.language || "text"}
                />
              )}
              {response.metadata.type === "image" && response.metadata.imageUrl && (
                <ImageDisplay
                  imageUrl={response.metadata.imageUrl}
                  alt="Explicação visual gerada por IA"
                />
              )}
              {response.metadata.type === "text" && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">{response.aiResponse}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}