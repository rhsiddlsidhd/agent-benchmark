"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Announcement } from "@/types/announcement";
import { useIntervalIndex } from "@/hooks/useIntervalIndex";

interface AnnouncementBarProps {
  items: Announcement[];
  activeIndex?: number;
  interval?: number;
}

export const AnnouncementBar = ({
  items,
  activeIndex,
  interval = 4000,
}: AnnouncementBarProps) => {
  const { currentIndex } = useIntervalIndex({
    length: items.length,
    interval,
    isPaused: activeIndex !== undefined,
  });

  if (items.length === 0) return null;

  const currentAnnouncement = items[activeIndex ?? currentIndex];

  return (
    <div className="relative flex h-9 items-center justify-center overflow-hidden bg-slate-900 text-xs font-medium tracking-tight text-white">
      <div className="container mx-auto flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnnouncement.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex items-center gap-2"
          >
            <span>{currentAnnouncement.text}</span>
            {currentAnnouncement.link && (
              <Link
                href={currentAnnouncement.link}
                className="group inline-flex items-center gap-1 underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                지금 확인
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
