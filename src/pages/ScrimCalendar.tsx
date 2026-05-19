import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Seo } from "@/components/Seo";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "@/hooks/useTeam";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
} from "date-fns";

interface CalendarScrim {
  id: string;
  scheduled_time: string;
  opponent_name: string;
  opponent_rank: string;
  status: string;
}

export default function ScrimCalendar() {
  const { team } = useTeam();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scrims, setScrims] = useState<CalendarScrim[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!team) return;

    const fetchScrims = async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data } = await supabase
        .from("scrims")
        .select("*")
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .gte("scheduled_time", start.toISOString())
        .lte("scheduled_time", end.toISOString())
        .order("scheduled_time", { ascending: true });

      if (!data || data.length === 0) { setScrims([]); return; }

      const opponentIds = data.map((s) =>
        s.home_team_id === team.id ? s.away_team_id : s.home_team_id
      );
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, rank")
        .in("id", opponentIds);

      const teamsMap = new Map(teamsData?.map((t) => [t.id, t]) ?? []);

      setScrims(
        data.map((s) => {
          const opId = s.home_team_id === team.id ? s.away_team_id : s.home_team_id;
          const op = teamsMap.get(opId);
          return {
            id: s.id,
            scheduled_time: s.scheduled_time,
            opponent_name: op?.name ?? "Unknown",
            opponent_rank: op?.rank ?? "",
            status: s.status,
          };
        })
      );
    };

    fetchScrims();
  }, [team, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getScrimsForDay = (day: Date) =>
    scrims.filter((s) => isSameDay(new Date(s.scheduled_time), day));

  const selectedScrims = selectedDate ? getScrimsForDay(selectedDate) : [];

  return (
    <PageTransition>
      <Seo title="Scrim Calendar | ScrimHQ" description="View all your scheduled scrims and upcoming matches in a monthly calendar view." path="/calendar" />
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scrim Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">View all your scheduled matches</p>
        </div>

        <div className="glass-panel p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold font-mono">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const daysScrims = getScrimsForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square rounded-lg p-1 text-sm transition-all flex flex-col items-center justify-start pt-1.5
                    ${!inMonth ? "text-muted-foreground/30" : "text-foreground"}
                    ${today ? "ring-1 ring-primary/50" : ""}
                    ${isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"}
                  `}
                >
                  <span className={`text-xs font-mono ${today ? "text-primary font-bold" : ""}`}>
                    {format(day, "d")}
                  </span>
                  {daysScrims.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {daysScrims.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            s.status === "completed" ? "bg-muted-foreground" : "bg-primary"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day details */}
        {selectedDate && (
          <StaggerContainer className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
            </div>
            {selectedScrims.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <p className="text-sm text-muted-foreground">No scrims on this day</p>
              </div>
            ) : (
              selectedScrims.map((scrim) => (
                <StaggerItem key={scrim.id}>
                  <div className="glass-panel-hover p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Swords className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">vs {scrim.opponent_name}</p>
                      <p className="text-xs text-muted-foreground">{scrim.opponent_rank}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono text-primary">{format(new Date(scrim.scheduled_time), "h:mm a")}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{scrim.status}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))
            )}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
