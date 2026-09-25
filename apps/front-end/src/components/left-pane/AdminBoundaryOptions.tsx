import ToggleSwitch from "@/components/common/ToggleSwitch";
import { ADMIN_BOUNDARY_LAYER_GROUP_IDS } from "../map/AdministrativeBoundaryTooltip";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { cn } from "@/lib/utils";

const AdminBoundaryOptions = () => {
  const dispatch = useAppDispatch();
  const { landDataLayers, showBoundaryNamesOnHover } = useAppSelector(
    (state) => state.landDataLayers,
  );

  // The pop-up only shows while a boundary layer is on, so the option is moot without one
  const disabled = !landDataLayers.some((layerId) =>
    ADMIN_BOUNDARY_LAYER_GROUP_IDS.includes(layerId),
  );

  return (
    <div
      className={cn(
        "-mt-px border-t-2 border-b border-border pt-5 pb-7",
        disabled && "opacity-50",
      )}
    >
      <div className="pl-12 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Options
      </div>
      <div
        className={cn(
          "flex items-center pt-2 pb-1 pl-12",
          !disabled && "cursor-pointer",
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) dispatch({ type: "TOGGLE_BOUNDARY_NAMES_ON_HOVER" });
        }}
      >
        <span className="mr-2.5 w-[calc(100%-49px)] select-none md:w-[286px]">
          Show boundary names on hover
        </span>
        <ToggleSwitch on={showBoundaryNamesOnHover} />
      </div>
      <div className="w-[calc(100%-107px)] pl-12 text-sm text-muted-foreground md:w-[276px]">
        Lists boundary names in a pop-up as you move over the map
      </div>
    </div>
  );
};

export default AdminBoundaryOptions;
