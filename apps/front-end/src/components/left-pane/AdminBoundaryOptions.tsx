import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { hasAdminBoundaryLayer } from "../../utils/adminBoundaries";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { autoSave } from "@/actions/MapActions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const LABEL_ID = "show-boundary-names-label";

const formSchema = z.object({
  showBoundaryNames: z.boolean(),
});

const AdminBoundaryOptions = () => {
  const dispatch = useAppDispatch();
  const { landDataLayers, showBoundaryNamesOnHover } = useAppSelector(
    (state) => state.landDataLayers,
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // values rather than defaultValues, as loading a map can change the setting
    values: { showBoundaryNames: showBoundaryNamesOnHover },
  });

  const disabled = !hasAdminBoundaryLayer(landDataLayers);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    dispatch({
      type: "SET_BOUNDARY_NAMES_ON_HOVER",
      payload: data.showBoundaryNames,
    });
    dispatch(autoSave());
  };

  return (
    <form className="px-4 py-3" onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="showBoundaryNames"
        control={form.control}
        render={({ field }) => (
          <FieldLabel
            className={cn(
              "select-none",
              disabled ? "opacity-50" : "cursor-pointer",
            )}
          >
            <Field orientation="horizontal" className="gap-3">
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
                checked={field.value}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  form.handleSubmit(onSubmit)();
                }}
              />
            </Field>
          </FieldLabel>
        )}
      />
    </form>
  );
};

export default AdminBoundaryOptions;
