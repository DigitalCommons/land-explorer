import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { hasAdminBoundaryLayer } from "../../utils/adminBoundaries";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { autoSave } from "@/actions/MapActions";
import { cn } from "@/lib/utils";

const LABEL_ID = "show-boundary-names-label";

const AdminBoundaryOptions = () => {
  const dispatch = useAppDispatch();
  const { landDataLayers, showBoundaryNamesOnHover } = useAppSelector(
    (state) => state.landDataLayers,
  );

  const disabled = !hasAdminBoundaryLayer(landDataLayers);

  const toggle = () => {
    dispatch({ type: "TOGGLE_BOUNDARY_NAMES_ON_HOVER" });
    dispatch(autoSave());
  };

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
      <Field
        orientation="horizontal"
        className={cn(
          "box-border gap-2.5 pt-2 pr-[14px] pl-12 select-none md:pr-[31px]",
          !disabled && "cursor-pointer",
        )}
        onClick={(e) => {
          // the switch reports its own changes, so only handle clicks elsewhere on the row
          const onSwitch = (e.target as HTMLElement).closest(
            "[data-slot=switch]",
          );
          if (!disabled && !onSwitch) toggle();
        }}
      >
        <FieldContent className="gap-1">
          <FieldTitle id={LABEL_ID} className="text-base font-normal">
            Show boundary names on hover
          </FieldTitle>
          <FieldDescription className="w-[calc(100%-10px)]">
            Lists boundary names in a pop-up as you move over the map
          </FieldDescription>
        </FieldContent>
        <Switch
          aria-labelledby={LABEL_ID}
          variant="legacy"
          className="mt-1 data-disabled:opacity-100"
          checked={showBoundaryNamesOnHover}
          disabled={disabled}
          onCheckedChange={toggle}
        />
      </Field>
    </div>
  );
};

export default AdminBoundaryOptions;
