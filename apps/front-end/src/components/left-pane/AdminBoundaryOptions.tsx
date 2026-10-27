import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="px-4 py-3">
      <Field
        orientation="horizontal"
        className={cn(
          "gap-3 rounded-lg border border-border p-3 select-none",
          disabled ? "opacity-50" : "cursor-pointer",
        )}
        onClick={(e) => {
          // the checkbox reports its own changes, so only handle clicks elsewhere on the card
          const onCheckbox = (e.target as HTMLElement).closest(
            "[data-slot=checkbox]",
          );
          if (!disabled && !onCheckbox) toggle();
        }}
      >
        <FieldContent className="gap-1">
          <FieldTitle id={LABEL_ID} className="text-base font-normal">
            Show boundary names on hover
          </FieldTitle>
          <FieldDescription>
            Lists boundary names in a pop-up as you move over the map
          </FieldDescription>
        </FieldContent>
        <Checkbox
          aria-labelledby={LABEL_ID}
          checked={showBoundaryNamesOnHover}
          disabled={disabled}
          onCheckedChange={toggle}
        />
      </Field>
    </div>
  );
};

export default AdminBoundaryOptions;
