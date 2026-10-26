import z from "zod";
import { ukPostcodeRegexp } from "@/lib/validation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateOrganisationAddress } from "@/actions/UserActions";

const organisationAddressSchema = z.object({
  address1: z.string().max(100, "Must not exceed 100 characters"),
  address2: z.string().max(100, "Must not exceed 100 characters"),
  city: z.string().max(100, "Must not exceed 100 characters"),
  postcode: z
    .string()
    .trim()
    .refine((v) => v === "" || ukPostcodeRegexp.test(v), "Invalid UK postcode"),
});

export const OrganisationAddress = () => {
  const { address1, address2, city, postcode } = useAppSelector(
    (state) => state.user,
  );
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof organisationAddressSchema>>({
    resolver: zodResolver(organisationAddressSchema),
    defaultValues: {
      address1,
      address2,
      city,
      postcode,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: z.infer<typeof organisationAddressSchema>) {
    const success = await dispatch(updateOrganisationAddress(data));

    if (success) {
      // Saved values become the form's new clean state
      form.reset(data);
      toast.success("Organisation address updated");
    } else {
      toast.error(
        "Organisation address failed to update, please try again later",
      );
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col">
        <div className="text-foreground flex flex-col gap-3">
          <form
            id="organisation-address"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldSet>
              <FieldDescription>
                Where your organisation is based.
              </FieldDescription>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="address1"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="gap-1.25"
                      >
                        <FieldLabel htmlFor="address1" className="text-left">
                          Address line 1
                        </FieldLabel>
                        <Input
                          {...field}
                          id="address1"
                          type="text"
                          placeholder="Address 1"
                          autoComplete="address-line1"
                          maxLength={101}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="address2"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="gap-1.25"
                      >
                        <FieldLabel htmlFor="address2" className="text-left">
                          Address line 2
                        </FieldLabel>
                        <Input
                          {...field}
                          id="address2"
                          type="text"
                          placeholder="Address 2"
                          autoComplete="address-line2"
                          maxLength={101}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="city"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="gap-1.25"
                      >
                        <FieldLabel htmlFor="city" className="text-left">
                          City
                        </FieldLabel>
                        <Input
                          {...field}
                          id="city"
                          type="text"
                          placeholder="City"
                          autoComplete="address-level2"
                          maxLength={101}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="postcode"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="gap-1.25"
                      >
                        <FieldLabel htmlFor="postcode" className="text-left">
                          Postcode
                        </FieldLabel>
                        <Input
                          {...field}
                          id="postcode"
                          type="text"
                          placeholder="Postcode"
                          autoComplete="postal-code"
                          maxLength={8}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>
          </form>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="organisation-address"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting && <Spinner />}
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
};
