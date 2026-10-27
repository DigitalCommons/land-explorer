import React, { useId, useState } from "react";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import iconChevron from "../../assets/img/icon-chevron.svg";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  title: string;
  settings?: React.ReactNode;
};

const DataLayersContainer = ({ children, title, settings }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <div
        className="relative flex cursor-pointer flex-row justify-between bg-[#eff0f2] px-[25px]"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="font-bold">{title}</h4>
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-3">
          {settings && (
            <>
              <button
                type="button"
                aria-label={`${title} settings`}
                aria-expanded={settingsOpen}
                aria-controls={panelId}
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(!settingsOpen);
                }}
                className={cn(
                  "cursor-pointer border-0 bg-transparent p-0 text-[#78838f]/80",
                  settingsOpen && "text-primary",
                )}
              >
                <FontAwesomeIcon icon={faGear} />
              </button>
              <span className="h-[18px] w-px bg-[#ccc]" />
            </>
          )}
          <img
            src={iconChevron}
            alt=""
            className={cn("size-6 origin-center", expanded && "rotate-180")}
          />
        </div>
      </div>
      {expanded && (
        <>
          {settings && (
            // the gear sits in the header, so it can't be a CollapsibleTrigger:
            // the root would have to wrap the header too, and shadcn-scope pulls
            // in Preflight, which strips the margins the h4 relies on for height
            <Collapsible open={settingsOpen}>
              <CollapsibleContent id={panelId}>{settings}</CollapsibleContent>
            </Collapsible>
          )}
          {children}
        </>
      )}
    </div>
  );
};

export default DataLayersContainer;
