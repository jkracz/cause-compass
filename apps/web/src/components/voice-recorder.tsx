"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WaveformAnimation() {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex h-7 items-end justify-center gap-1">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-pink-500 to-purple-500"
          animate={{ height: [12, 28, 12] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onAudioData: (audioBlob: Blob) => void;
  className?: string;
}

export function VoiceRecorder({
  onTranscription,
  onAudioData,
  className,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        onAudioData(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Start transcription
        void transcribeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Track voice recording started
      posthog.capture("voice_recording_started");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      posthog.captureException(error);
      alert("Unable to access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setTranscriptionError(false);
    onTranscription("");
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(false);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Transcription failed");
      }

      const data = (await response.json()) as {
        text: string;
        language?: string;
        durationInSeconds?: number;
      };
      onTranscription(data.text);

      posthog.capture("voice_transcription_completed", {
        duration_seconds: data.durationInSeconds,
        language: data.language,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      posthog.captureException(error);
      setTranscriptionError(true);
      onTranscription("");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording && !audioBlob && (
          <Button
            onClick={() => void startRecording()}
            size="lg"
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
          >
            <Mic className="h-6 w-6" />
            <span className="sr-only">Start recording</span>
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            size="lg"
            className="h-16 w-16 rounded-full bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-700"
          >
            <Square className="h-5 w-5 fill-current" />
            <span className="sr-only">Stop recording</span>
          </Button>
        )}

        {audioBlob && !isRecording && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={isPlaying ? pauseRecording : playRecording}
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isPlaying ? "Pause" : "Play"} recording
              </span>
            </Button>

            <Button
              onClick={resetRecording}
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Reset recording</span>
            </Button>
          </div>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium">
              Recording: {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Recording complete: {formatTime(recordingTime)}
          </p>
        </div>
      )}

      {isTranscribing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <WaveformAnimation />
          <span className="text-muted-foreground text-sm">Transcribing...</span>
        </motion.div>
      )}

      {transcriptionError && !isTranscribing && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center"
        >
          <p className="text-sm text-amber-200">
            We couldn&apos;t catch that — try speaking a bit louder or closer to
            your mic
          </p>
        </motion.div>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
