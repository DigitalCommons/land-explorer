import z from "zod";
import { ukPostcodeRegexp } from "@/lib/validation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { updateOrganisationDetails } from "@/actions/UserActions";
import { OrgDetails } from "@/reducers/UserReducer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Option = { value: string; label: string };

const ORG_TYPES: Option[] = [
  {value: "", label: "Not specified"},
  { value: "academic-institution", label: "Academic institution" },
  { value: "community-group", label: "Community group" },
  { value: "not-for-profit", label: "Not for profit organisation" },
  { value: "private-sector", label: "Private sector" },
  { value: "public-sector", label: "Public sector" },
  { value: "sole-trader", label: "Sole trader" },
  { value: "other", label: "Other" },
];

const ORG_ACTIVITIES: Option[] = [
  {value: "", label: "Not specified"},
  { value: "amenity-recreation", label: "Amenity and recreation" },
  { value: "community-development", label: "Community development" },
  {
    value: "conservation-biodiversity",
    label: "Conservation and biodiversity",
  },
  { value: "economic-development", label: "Economic development" },
  { value: "food-growing", label: "Food growing" },
  { value: "health-services", label: "Health services" },
  { value: "housing", label: "Housing" },
  { value: "neighbourhood-planning", label: "Neighbourhood planning" },
  { value: "policy-development", label: "Policy development" },
  {
    value: "professional-consultancy",
    label: "Professional / consultancy services",
  },
  { value: "public-services", label: "Public services" },
  {
    value: "renewable-energy-generation",
    label: "Renewable energy generation",
  },
  { value: "training-education", label: "Training and education services" },
  { value: "woodland-management", label: "Woodland management" },
  { value: "other", label: "Other" },
];

const organisationDetailsSchema = z
  .object({
    orgName: z.string().max(100, "Must not exceed 100 characters"),
    orgType: z.literal(ORG_TYPES.map((x) => x.value)),
    orgTypeOther: z.string().trim().max(100, "Must not exceed 100 characters"),
    orgActivity: z.literal(ORG_ACTIVITIES.map((x) => x.value)),
    orgActivityOther: z
      .string()
      .trim()
      .max(100, "Must not exceed 100 characters"),
    orgNumber: z.string().max(100, "Must not exceed 100 characters"),
    address1: z.string().max(100, "Must not exceed 100 characters"),
    address2: z.string().max(100, "Must not exceed 100 characters"),
    city: z.string().max(100, "Must not exceed 100 characters"),
    postcode: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || ukPostcodeRegexp.test(v),
        "Invalid UK postcode",
      ),
  })
  .superRefine((data, ctx) => {
    if (data.orgType === "other" && !data.orgTypeOther) {
      ctx.addIssue({
        code: "custom",
        path: ["orgTypeOther"],
        message: "Please specify your organisation type",
      });
    }
    if (data.orgActivity === "other" && !data.orgActivityOther) {
      ctx.addIssue({
        code: "custom",
        path: ["orgActivityOther"],
        message: "Please specify your organisation activity",
      });
    }
  });

export const OrganisationDetails = () => {
  const {
    organisation,
    organisationType,
    organisationActivity,
    organisationNumber,
    address1,
    address2,
    city,
    postcode,
  } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof organisationDetailsSchema>>({
    resolver: zodResolver(organisationDetailsSchema),
    defaultValues: {
      orgName: organisation,
      orgNumber: organisationNumber,
      orgType: ORG_TYPES.map((x) => x.value).includes(organisationType) ? organisationType : "other",
      orgTypeOther: ORG_TYPES.map((x) => x.value).includes(organisationType) ? "" : organisationType,        
      orgActivity: ORG_ACTIVITIES.map((x) => x.value).includes(organisationActivity) ? organisationActivity : "other",
      orgActivityOther: ORG_ACTIVITIES.map((x) => x.value).includes(organisationActivity) ? "" : organisationActivity,
      address1,
      address2,
      city,
      postcode,
    },
  });

  const { isSubmitting } = form.formState;

  const orgType = useWatch({ control: form.control, name: "orgType" });
  const orgActivity = useWatch({
    control: form.control,
    name: "orgActivity",
  });

  async function onSubmit(data: z.infer<typeof organisationDetailsSchema>) {
    const details: OrgDetails = {
      organisation: data.orgName,
      organisationNumber: data.orgNumber,
      organisationType:
        data.orgType === "other" ? data.orgTypeOther : data.orgType,
      organisationActivity:
        data.orgActivity === "other" ? data.orgActivityOther : data.orgActivity,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      postcode: data.postcode,
    };

    const success = await dispatch(updateOrganisationDetails(details));

    if (success) {
      // Saved values become the form's new clean state
      form.reset(data);
      toast.success("Organisation details updated");
    } else {
      toast.error(
        "Organisation details failed to update, please try again later",
      );
    }
  }

  return (
    // Fills the panel so the footer stays visible while the fields scroll
    <Card className="absolute inset-0">
      <CardContent className="flex flex-col min-h-0 grow overflow-y-auto">
        <div className="text-foreground flex flex-col gap-3">
          <form
            id="organisation-details"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <FieldSet>
                <FieldDescription>
                  Tell us more about the organisation you're using Land Explorer for.
                </FieldDescription>
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="orgName"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.25"
                        >
                          <FieldLabel
                            htmlFor="organisation"
                            className="text-left"
                          >
                            Organisation name
                          </FieldLabel>
                          <Input
                            {...field}
                            id="organisation"
                            type="text"
                            placeholder="Organisation Name"
                            maxLength={101}
                            autoComplete="organization"
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
                      name="orgNumber"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.25"
                        >
                          <FieldLabel
                            htmlFor="organisationNumber"
                            className="text-left"
                          >
                            Organisation or charity number
                          </FieldLabel>
                          <Input
                            {...field}
                            id="organisationNumber"
                            type="text"
                            placeholder="Organisation / Charity number"
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
                    <Controller
                      control={form.control}
                      name="orgType"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.25"
                        >
                          <FieldLabel htmlFor="orgType" className="text-left">
                            Organisation type
                          </FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value}
                            items={ORG_TYPES}
                            onValueChange={(v) => {
                              field.onChange(v);
                              if (v !== "other")
                                form.setValue("orgTypeOther", "");
                            }}
                          >
                            <SelectTrigger
                              id="orgType"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ORG_TYPES.map((t) => (
                                <SelectItem
                                  key={t.value ?? "none"}
                                  value={t.value}
                                >
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="orgTypeOther"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          data-disabled={orgType !== "other"}
                          className="gap-1.25"
                        >
                          <FieldLabel
                            htmlFor="orgTypeOther"
                            className="text-left"
                          >
                            Please specify (if other)
                          </FieldLabel>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            id="orgTypeOther"
                            maxLength={101}
                            disabled={orgType !== "other"}
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
                      name="orgActivity"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.25"
                        >
                          <FieldLabel
                            htmlFor="orgActivity"
                            className="text-left"
                          >
                            Organisation Activity
                          </FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value}
                            items={ORG_ACTIVITIES}
                            onValueChange={(v) => {
                              field.onChange(v);
                              if (v !== "other")
                                form.setValue("orgActivityOther", "");
                            }}
                          >
                            <SelectTrigger
                              id="orgActivity"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ORG_ACTIVITIES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="orgActivityOther"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          data-disabled={orgActivity !== "other"}
                          className="gap-1.25"
                        >
                          <FieldLabel
                            htmlFor="orgActivityOther"
                            className="text-left"
                          >
                            Please specify (if other)
                          </FieldLabel>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            id="orgActivityOther"
                            maxLength={101}
                            disabled={orgActivity !== "other"}
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
            </FieldGroup>
          </form>
        </div>
      </CardContent>
      <CardFooter className="shrink-0">
        <Button
          type="submit"
          form="organisation-details"
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
