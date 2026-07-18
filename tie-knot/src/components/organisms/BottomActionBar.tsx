import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

const BottomActionBar = ({
  children,
  disabled = false,
}: {
  children?: React.ReactNode;
  disabled?: boolean;
}) => {
  const [isFormEndVisible, setIsFormEndVisible] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bottomRef.current) return;
    const options = {
      threshold: 1.0,
    };
    const io = new IntersectionObserver(([entry]) => {
      setIsFormEndVisible(entry.isIntersecting);
    }, options);

    io.observe(bottomRef.current);
    return () => {
      io.disconnect();
    };
  }, []);
  return (
    <div>
      <Separator
        className="pointer-events-none m-0 h-px opacity-0"
        ref={bottomRef}
      />
      <div
        className={clsx(
          `bg-background/80 border-border fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-sm`,
          `transition-all duration-500 ease-out`,
          isFormEndVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-5xl gap-4">
            <Button
              disabled={disabled}
              type="submit"
              size="lg"
              className="flex-1 cursor-pointer"
            >
              {children}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomActionBar;
