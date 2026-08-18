import React from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
};

const LeftPaneTray = ({ open, title, onClose, header, children }: Props) => {
  return (
    <div
      className={cn(
        "fixed top-17 bottom-0 left-18 z-100000 flex w-[calc(100vw-72px)] flex-col overflow-x-hidden bg-background transition-transform duration-500 ease-in-out md:w-100",
        open
          ? "translate-x-0 shadow-[3px_0_6px_0_rgba(0,0,0,0.16)]"
          : "translate-x-[-200%]",
      )}
    >
      <div className="flex-none border-b border-border">
        <div className="relative flex h-14.5 w-full items-center">
          <div className="ml-5 text-2xl text-primary">{title}</div>
          <Button
            aria-label="Close"
            onClick={onClose}
            variant="ghost"
            className="absolute right-5"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
        {header ? header : null}
      </div>
      <div className="flex grow flex-col overflow-y-auto">{children}</div>
    </div>
  );
};

export default LeftPaneTray;
