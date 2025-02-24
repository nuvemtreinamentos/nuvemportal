import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Course, CoursePrompt, Tutor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();

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

  const acknowledgeMutation = useMutation({
    mutationFn: async (coursePromptId: string) => {
      // Get the latest context for this prompt
      const contexts = await apiRequest('/api/context?coursePromptId=' + coursePromptId, {
        method: 'GET'
      });
      const latestContext = contexts[0];

      if (!latestContext) {
        throw new Error("No context found");
      }

      // Acknowledge the context
      return await apiRequest(`/api/context/${latestContext.id}/ack`, {
        method: "PATCH",
        body: JSON.stringify({ ack: true }),
      });
    }
  });

  const handleTutorSelect = async (tutor: Tutor) => {
    try {
      if (!prompts?.length) {
        throw new Error("No prompts available");
      }

      // Acknowledge the first prompt's context when tutor is selected
      await acknowledgeMutation.mutateAsync(prompts[0].id);

      toast({
        title: "Tutor Selected",
        description: `${tutor.name} will be your guide for this course.`,
      });
    } catch (error) {
      console.error('Error selecting tutor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select tutor. Please try again.",
      });
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
                <p>{prompt.prompt}</p>
              </div>
            ))}

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              {tutors?.map((tutor) => (
                <Card 
                  key={tutor.id} 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleTutorSelect(tutor)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{tutor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tutor.style}</p>
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