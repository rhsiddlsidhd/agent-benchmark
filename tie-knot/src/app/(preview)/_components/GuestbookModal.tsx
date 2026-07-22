"use client";

import { GuestbookModalType, useGuestbookModalStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/atoms";
import { ViewContact } from "./ViewContact";
import { cn } from "@/lib/cn";
import clsx from "clsx";
import { DeleteGuestbookForm } from "./DeleteGuestbookForm";
import { CreateGuestbookForm } from "./CreateGuestbookForm";

const GUESTBOOK: Record<
  GuestbookModalType,
  React.ComponentType<{ payload: unknown }>
> = {
  WRITE_GUESTBOOK: CreateGuestbookForm,
  DELETE_GUESTBOOK: DeleteGuestbookForm,
  VIEW_CONTACT: ViewContact,
};

const GuestbookModal = () => {
  const { isOpen, type, payload, closeModal, clearIsOpen } =
    useGuestbookModalStore();
  const [dialogOpen, setDialogOpen] = useState(true);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const Component = useMemo(() => {
    return type ? GUESTBOOK[type] : null;
  }, [type]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDialogOpen(true);
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setTimeout(() => {
        closeModal();
      }, 200);
    }
  };

  const handleBackdropClick = () => {
    setDialogOpen(false);
    setTimeout(() => {
      closeModal();
    }, 200);
  };

  if (!Component) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (!isOpen) clearIsOpen();
          }}
          className={clsx(
            `fixed inset-0 z-50 flex transform-gpu items-center justify-center bg-black/60 p-4 backdrop-blur-sm`,
            type === "VIEW_CONTACT" && `bg-purple-300/50`,
          )}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) {
              handleBackdropClick();
            }
          }}
        >
          <Dialog
            modal={false}
            open={dialogOpen}
            onOpenChange={handleDialogClose}
          >
            <DialogContent
              className={cn(
                `sm:max-w-106.25`,
                type === "VIEW_CONTACT" &&
                  "rounded-none border-2 border-r-0 border-l-0 border-dotted border-gray-500/50 bg-transparent shadow-none",
              )}
            >
              <Component payload={payload} />
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { GuestbookModal };
