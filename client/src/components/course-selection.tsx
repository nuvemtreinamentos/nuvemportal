import { useQuery, useMutation } from "@tanstack/react-query";
import { Book, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Course } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CourseSelection({ onSelect }: { onSelect: (courseId: string) => void }) {
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery({ 
    queryKey: ['/api/courses'],
    retry: false
  });

  const createContextMutation = useMutation({
    mutationFn: async (courseId: string) => {
      // First get the initial prompt for this course
      const prompts = await apiRequest(`/api/courses/${courseId}/prompts`);
      const firstPrompt = prompts[0];

      if (!firstPrompt) {
        throw new Error("No prompts found for this course");
      }

      // Create context for the first prompt
      return await apiRequest("/api/context", {
        method: "POST",
        body: {
          coursePromptId: firstPrompt.id,
        },
      });
    }
  });

  const handleSelect = async (courseId: string) => {
    try {
      await createContextMutation.mutateAsync(courseId);
      onSelect(courseId);
    } catch (error) {
      console.error('Error creating context:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start the course. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </CardHeader>
        </Card>
        <Card className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses?.map((course: Course) => (
        <Card 
          key={course.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleSelect(course.id)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {course.name === "English Course" ? (
                <Book className="h-5 w-5" />
              ) : (
                <Code className="h-5 w-5" />
              )}
              {course.name}
            </CardTitle>
            <CardDescription>
              {course.name === "English Course" 
                ? "Aprenda inglês com um tutor personalizado de IA"
                : "Aprenda programação Python com exercícios práticos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {course.name === "English Course"
                ? "Conversação, gramática e vocabulário adaptados ao seu nível"
                : "Do básico ao avançado com projetos reais e feedback em tempo real"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}