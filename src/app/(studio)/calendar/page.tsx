"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EventTypeDot, eventTypeColor, eventTypeLabel } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/lib/types";
import { useCrm } from "@/context/crm-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { data, openDialog, deleteEvent } = useCrm();
  const { allow } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedEvents = data.events.filter((event) =>
    selected ? event.date === selected : false
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Deadlines, meetings, shoots, and payment dates — color-coded by type."
        actions={
          allow("createRecords") ? (
          <Button
            onClick={() =>
              openDialog("event", null, {
                date: selected ?? format(new Date(), "yyyy-MM-dd"),
              })
            }
          >
            <Plus />
            Add event
          </Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft />
          </Button>
          <p className="font-heading min-w-40 text-center text-2xl">
            {format(cursor, "MMMM yyyy")}
          </p>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {EVENT_TYPES.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", eventTypeColor(type))} />
              {eventTypeLabel(type)}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="grid grid-cols-7 border-b border-border/70 text-center text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const events = data.events.filter((event) => event.date === key);
              const inMonth = isSameMonth(day, cursor);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  onDoubleClick={() => openDialog("event", null, { date: key })}
                  className={cn(
                    "min-h-24 border-r border-b border-border/50 p-2 text-left transition hover:bg-accent/40",
                    !inMonth && "opacity-40",
                    selected === key && "bg-accent/60"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-1 truncate text-[11px]"
                      >
                        <EventTypeDot type={event.type} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {events.length > 3 ? (
                      <p className="text-[10px] text-muted-foreground">
                        +{events.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {selected ? format(parseISO(selected), "MMMM d, yyyy") : "Select a day"}
          </p>
          <div className="mt-4 space-y-3">
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                Choose a date to review or add events.
              </p>
            ) : selectedEvents.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">No events on this day.</p>
                {allow("createRecords") ? (
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => openDialog("event", null, { date: selected })}
                >
                  Add event
                </Button>
                ) : null}
              </div>
            ) : (
              selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border/70 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <EventTypeDot type={event.type} />
                        <p className="text-sm font-medium">{event.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {eventTypeLabel(event.type)}
                        {event.notes ? ` · ${event.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {allow("editRecords") ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog("event", event.id)}
                    >
                      Edit
                    </Button>
                    ) : null}
                    {allow("deleteRecords") ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEvent(event.id)}
                    >
                      Delete
                    </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
