import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { autoSave } from "@/actions/MapActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const LABEL_ID = "show-boundary-names-label";

const formSchema = z.object({
  showBoundaryNames: z.boolean(),
});

const AdminBoundaryOptions = () => {
  const dispatch = useAppDispatch();
  const showBoundaryNamesOnHover = useAppSelector(
    (state) => state.landDataLayers.showBoundaryNamesOnHover,
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // values rather than defaultValues, as loading a map can change the setting
    values: { showBoundaryNames: showBoundaryNamesOnHover },
  });

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
          <FieldLabel className="cursor-pointer border-input select-none">
            <Field orientation="horizontal" className="gap-3 rounded-lg">
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
