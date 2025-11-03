"use client";

import { useState } from "react";
import { Mic, PenTool } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/lib/questions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VoiceRecorder } from "@components/voice-recorder";

interface MirrorQuestionProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
  value?: string | string[];
  isFirstQuestion?: boolean;
}

export function MirrorQuestion({
  question,
  onAnswer,
  value,
  isFirstQuestion = false,
}: MirrorQuestionProps) {
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleVoiceTranscription = (transcription: string) => {
    onAnswer(transcription);
  };

  const handleAudioData = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case "text":
        return (
          <div className="space-y-4">
            {isFirstQuestion && (
              <div className="flex items-center justify-center space-x-2 rounded-lg bg-white/5 p-2">
                <Button
                  variant={inputMode === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInputMode("text")}
                  className="flex-1"
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  Write
                </Button>
                <Button
                  variant={inputMode === "voice" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInputMode("voice")}
                  className="flex-1"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Speak
                </Button>
              </div>
            )}

            {inputMode === "text" || !isFirstQuestion ? (
              <Textarea
                placeholder="Share what's on your mind..."
                className="min-h-[120px] resize-none"
                value={(value as string) || ""}
                onChange={(e) => onAnswer(e.target.value)}
              />
            ) : (
              <div className="rounded-lg border border-white/20 bg-white/5 p-6">
                <VoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  onAudioData={handleAudioData}
                />
                {value && (
                  <div className="mt-4 rounded-lg bg-white/10 p-3">
                    <p className="mb-2 text-sm font-medium">Your response:</p>
                    <p className="text-sm">{value as string}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "multiple":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={option.value}
                  checked={((value as string[]) || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = (value as string[]) || [];
                    if (checked) {
                      onAnswer([...currentValues, option.value]);
                    } else {
                      onAnswer(currentValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label
                  htmlFor={option.value}
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={(value) => onAnswer(value)}
          >
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  return <div className="space-y-4">{renderQuestionInput()}</div>;
}
