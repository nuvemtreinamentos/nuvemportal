import { useQuery } from "@tanstack/react-query";
import { Book, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Course } from "@shared/schema";

export function CourseSelection({ onSelect }: { onSelect: (courseId: string) => void }) {
  const { data: courses, isLoading } = useQuery({ 
    queryKey: ['/api/courses'],
    retry: false
  });

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
          onClick={() => onSelect(course.id)}
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
