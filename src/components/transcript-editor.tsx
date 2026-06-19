"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { TranscriptTurn } from "@/types/database";

interface TranscriptEditorProps {
  turns: TranscriptTurn[];
  onChange: (turns: TranscriptTurn[]) => void;
}

export function TranscriptEditor({ turns, onChange }: TranscriptEditorProps) {
  const addTurn = () => {
    const nextTurn = turns.length + 1;
    const lastSpeaker = turns.length > 0 ? turns[turns.length - 1].speaker : "candidate";
    const newSpeaker = lastSpeaker === "interviewer" ? "candidate" : "interviewer";
    onChange([...turns, { turn: nextTurn, speaker: newSpeaker, text: "" }]);
  };

  const updateTurn = (index: number, field: keyof TranscriptTurn, value: string | number) => {
    const updated = turns.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    onChange(updated);
  };

  const removeTurn = (index: number) => {
    const updated = turns.filter((_, i) => i !== index).map((t, i) => ({ ...t, turn: i + 1 }));
    onChange(updated);
  };

  const moveTurn = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= turns.length) return;
    const updated = [...turns];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((t, i) => ({ ...t, turn: i + 1 })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Transcript ({turns.length} turns)</h4>
        <Button type="button" variant="outline" size="sm" onClick={addTurn}>
          <Plus className="h-3 w-3 mr-1" />
          Add Turn
        </Button>
      </div>

      {turns.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
          No transcript turns yet. Click &ldquo;Add Turn&rdquo; to start building the case dialogue.
        </p>
      )}

      {turns.map((turn, index) => (
        <Card key={index} className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-6">#{turn.turn}</span>
            <Select
              value={turn.speaker}
              onValueChange={(val) => updateTurn(index, "speaker", val)}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interviewer">Interviewer</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              type="button" variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => moveTurn(index, -1)} disabled={index === 0}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              type="button" variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => moveTurn(index, 1)} disabled={index === turns.length - 1}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
              onClick={() => removeTurn(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={turn.text}
            onChange={(e) => updateTurn(index, "text", e.target.value)}
            placeholder={`${turn.speaker === "interviewer" ? "Interviewer" : "Candidate"} says...`}
            rows={3}
            className="text-sm"
          />
        </Card>
      ))}

      {turns.length > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={addTurn} className="w-full">
          <Plus className="h-3 w-3 mr-1" />
          Add Turn
        </Button>
      )}
    </div>
  );
}
