import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LearningActivity } from "@shared/schema";
import CalendarHeatmap from "react-calendar-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-calendar-heatmap/dist/styles.css";

interface ActivityValue {
  date: string;
  count: number;
}

export function LearningHeatmap() {
  const { user } = useAuth();
  const startDate = subMonths(new Date(), 6);
  const endDate = new Date();

  const { data: activities } = useQuery<LearningActivity[]>({
    queryKey: ["/api/learning-activities", user?.id],
    enabled: !!user,
  });

  const getActivityValues = (type: "programming" | "english"): ActivityValue[] => {
    if (!activities) return [];

    const filtered = activities.filter(
      (activity) => activity.activityType === type
    );

    const values: { [date: string]: number } = {};
    filtered.forEach((activity) => {
      const date = format(new Date(activity.activityDate), "yyyy-MM-dd");
      values[date] = (values[date] || 0) + activity.progress;
    });

    return Object.entries(values).map(([date, count]) => ({ date, count }));
  };

  const getTooltipTitle = (value: ActivityValue | null) => {
    if (!value || !value.count) return "Nenhuma atividade";
    return `${value.count}% de progresso em ${format(new Date(value.date), "dd 'de' MMMM", {
      locale: ptBR,
    })}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Seu Progresso de Aprendizado</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="programming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="programming">Programação</TabsTrigger>
            <TabsTrigger value="english">Inglês</TabsTrigger>
          </TabsList>

          <TabsContent value="programming" className="space-y-4">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={getActivityValues("programming")}
              classForValue={(value: ActivityValue | null) => {
                if (!value || !value.count) return "color-empty";
                return `color-github-${Math.min(4, Math.ceil(value.count / 25))}`;
              }}
              titleForValue={(value: ActivityValue | null) => getTooltipTitle(value)}
            />
          </TabsContent>

          <TabsContent value="english" className="space-y-4">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={getActivityValues("english")}
              classForValue={(value: ActivityValue | null) => {
                if (!value || !value.count) return "color-empty";
                return `color-github-${Math.min(4, Math.ceil(value.count / 25))}`;
              }}
              titleForValue={(value: ActivityValue | null) => getTooltipTitle(value)}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}