"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PipelineStage } from "@/lib/types";

const COLORS = ["#c4b49a", "#8fa6c2", "#c9a45c", "#b08968", "#7d9b76", "#d4c4a8", "#8a5a52", "#6e7f8a"];

export function StageForm({
  stages,
  onSave,
  onReorder,
  onDelete,
  onCancel,
}: {
  stages: PipelineStage[];
  onSave: (input: { id?: string; name: string; color: string }) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim()) {
            setError("Name is required.");
            return;
          }
          await onSave({ id: editingId ?? undefined, name, color });
          setName("");
          setEditingId(null);
          setError("");
        }}
      >
        <div className="space-y-1.5">
          <Label>{editingId ? "Rename category" : "New category"}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hold" />
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button
              key={item}
              type="button"
              className="size-6 rounded-full border"
              style={{
                background: item,
                boxShadow: color === item ? `0 0 0 2px ${item}` : undefined,
              }}
              onClick={() => setColor(item)}
            />
          ))}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button type="submit">{editingId ? "Save category" : "Create category"}</Button>
      </form>
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: stage.color }} />
              <span className="text-sm">{stage.name}</span>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => {
                  const ids = stages.map((item) => item.id);
                  [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                  void onReorder(ids);
                }}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === stages.length - 1}
                onClick={() => {
                  const ids = stages.map((item) => item.id);
                  [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                  void onReorder(ids);
                }}
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(stage.id);
                  setName(stage.name);
                  setColor(stage.color);
                }}
              >
                Edit
              </Button>
              {stage.kind === "custom" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void onDelete(stage.id)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}
