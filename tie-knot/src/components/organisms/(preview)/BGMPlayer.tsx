"use client";

import { useState, useRef, useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/atoms/button";

interface BgmPlayerProps {
  bgmUrl?: string;
}

export function BgmPlayer({ bgmUrl }: BgmPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (!bgmUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={bgmUrl} loop />
      <div className="fixed top-4 right-4 z-50 border-2 border-red-500">
        <Button
          variant="secondary"
          size="icon"
          className="bg-background/95 border-border h-12 w-12 rounded-full border shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "음악 일시정지" : "음악 재생"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </Button>
      </div>
    </>
  );
}
