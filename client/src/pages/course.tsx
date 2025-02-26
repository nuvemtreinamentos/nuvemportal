import { useQuery } from "@tanstack/react-query";
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

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();

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

  useEffect(() => {
    if (tutors && !tutorsLoading) {
      const playDescriptions = async () => {
        for (const tutor of tutors) {
          const description = `${tutor.name}. ${tutor.style}`;
          await playTutorDescription(description);
        }
      };
      playDescriptions();
    }
  }, [tutors, tutorsLoading]);

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