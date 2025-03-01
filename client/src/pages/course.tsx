import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserCircle2 } from "lucide-react";
import type { Course, CoursePrompt, Tutor } from "@shared/schema";
import { useEffect } from "react";
// Import tutor images
import albertEinstein from "../../../attached_assets/albert einstein.jpg";
import marieCurie from "../../../attached_assets/marie curie.jpg";

// Map of tutor names to their image imports
const tutorImages: Record<string, string> = {
  "Albert Einstein": albertEinstein,
  "Marie Curie": marieCurie
};

async function playTutorDescription(text: string) {
  try {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Failed to generate speech');

    const audioData = await response.arrayBuffer();
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audio.play();
    });
  } catch (error) {
    console.error('Error playing tutor description:', error);
    return Promise.resolve(false);
  }
}

async function processAndPlayPrompt(contextId: string) {
  try {
    const response = await fetch('/api/process-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contextId }),
    });

    if (!response.ok) throw new Error('Failed to process prompt');

    const data = await response.json();

    // Convert base64 audio to blob
    const audioBuffer = Buffer.from(data.audio, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audio.play();
    });
  } catch (error) {
    console.error('Error processing and playing prompt:', error);
    return Promise.resolve(false);
  }
}

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    retry: false,
  });

  const { data: prompts, isLoading: promptsLoading } = useQuery<CoursePrompt[]>({
    queryKey: [`/api/courses/${courseId}/prompts`],
    retry: false,
  });

  const { data: tutors, isLoading: tutorsLoading } = useQuery<Tutor[]>({
    queryKey: ['/api/tutors'],
    retry: false,
  });

  // Create context mutation
  const createContextMutation = useMutation({
    mutationFn: async (coursePromptId: string) => {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coursePromptId }),
      });
      if (!response.ok) throw new Error('Failed to create context');
      return response.json();
    },
  });

  // Update context mutation
  const updateContextMutation = useMutation({
    mutationFn: async (contextId: string) => {
      const response = await fetch(`/api/context/${contextId}/ack`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update context');
      return response.json();
    },
  });

  // Effect to create initial context when course is loaded
  useEffect(() => {
    if (prompts?.length && !promptsLoading) {
      const firstPrompt = prompts[0];
      createContextMutation.mutate(firstPrompt.id);
    }
  }, [prompts, promptsLoading]);

  // Effect for audio playback
  useEffect(() => {
    if (tutors && !tutorsLoading) {
      const playDescriptions = async () => {
        // First play the welcome message in Portuguese
        await playTutorDescription("Olá aluno, qual tutor você quer que te acompanhe nos seus estudos?");

        // Then play each tutor's description
        for (const tutor of tutors) {
          const description = `${tutor.name}. ${tutor.style}`;
          await playTutorDescription(description);
        }
      };
      playDescriptions();
    }
  }, [tutors, tutorsLoading]);

  const handleTutorSelect = async (tutorId: string) => {
    try {
      // Get the current context
      const response = await fetch('/api/context/current');
      const currentContext = await response.json();

      // Mark current context as acknowledged
      await updateContextMutation.mutateAsync(currentContext.id);

      // Get next prompt
      if (prompts && prompts.length > 1) {
        const nextPrompt = prompts[1];
        // Create new context for next prompt
        const newContext = await createContextMutation.mutateAsync(nextPrompt.id);

        // Process and play the new prompt
        await processAndPlayPrompt(newContext.id);
      }
    } catch (error) {
      console.error('Error handling tutor selection:', error);
    }
  };

  if (courseLoading || promptsLoading || tutorsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Course Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested course could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {prompts?.map((prompt) => (
              <div key={prompt.id} className="mb-4">
                <p className="text-muted-foreground">{prompt.prompt}</p>
              </div>
            ))}

            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {tutors?.map((tutor) => (
                <Card
                  key={tutor.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleTutorSelect(tutor.id)}
                >
                  <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage
                        src={tutorImages[tutor.name]}
                        alt={tutor.name}
                      />
                      <AvatarFallback>
                        <UserCircle2 className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">{tutor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{tutor.style}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}