import { Widget, WidgetContent } from "@/components/ui/widget";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function WidgetDemo() {
  const now = new Date();

  const dayName = now.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = now.toLocaleDateString("en-US", { month: "short" });
  const date = now.getDate();
  const paddedDate = date.toString().padStart(2, "0");

  const year = now.getFullYear();
  const month = now.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Widget size="sm" className="!w-64 !h-32">
      <WidgetContent className="items-center justify-between gap-2">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="flex w-full items-center justify-center gap-1.5">
            <Label className="text-destructive text-base">{dayName}</Label>
            <Label className="text-base">{monthName}</Label>
          </div>
          <Label className="text-5xl font-bold">{paddedDate}</Label>
        </div>

        <div className="grid size-full grid-cols-7 gap-0.5 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px]">
              {d}
            </div>
          ))}

          {calendarDays.map((d, i) => (
            <div key={i} className="text-muted-foreground text-[10px]">
              {d === date ? (
                <Badge className="flex size-3.5 items-center justify-center p-1.5 text-[9px]">
                  {d}
                </Badge>
              ) : (
                (d ?? <>&nbsp;</>)
              )}
            </div>
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}
