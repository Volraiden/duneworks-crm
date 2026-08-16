"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES } from "@/lib/types";
import type { CalendarEvent, Client, Project } from "@/lib/types";
import { eventTypeLabel } from "@/components/status-badge";

export function EventForm({
  event,
  clients,
  projects,
  presetDate,
  onSubmit,
  onCancel,
}: {
  event?: CalendarEvent;
  clients: Client[];
  projects: Project[];
  presetDate?: string;
  onSubmit: (values: Omit<CalendarEvent, "id">) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? presetDate ?? "");
  const [type, setType] = useState(event?.type ?? "meeting");
  const [clientId, setClientId] = useState(event?.clientId ?? "");
  const [projectId, setProjectId] = useState(event?.projectId ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [error, setError] = useState("");

  const clientProjects = projects.filter((project) =>
    clientId ? project.clientId === clientId : true
  );

  return (
    <form
      className="grid gap-4"
      onSubmit={async (eventSubmit) => {
        eventSubmit.preventDefault();
        if (!title.trim() || !date) {
          setError("Title and date are required.");
          return;
        }
        await onSubmit({
          title: title.trim(),
          date,
          type,
          notes,
          clientId: clientId || undefined,
          projectId: projectId || undefined,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {eventTypeLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Client (optional)</Label>
          <Select
            value={clientId || "none"}
            onValueChange={(value) => setClientId(value === "none" ? "" : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Project (optional)</Label>
          <Select
            value={projectId || "none"}
            onValueChange={(value) => setProjectId(value === "none" ? "" : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {clientProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{event ? "Save event" : "Add event"}</Button>
      </div>
    </form>
  );
}
