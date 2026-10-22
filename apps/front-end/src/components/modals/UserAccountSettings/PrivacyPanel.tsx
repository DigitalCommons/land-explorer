import { setAnalyticsConsent } from "@/actions/UserActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  analytics: z.boolean(),
});

export const PrivacyPanel = () => {
  const dispatch = useAppDispatch();
  const { analyticsConsent } = useAppSelector((state) => state.user);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analytics: analyticsConsent ?? false,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const success = await dispatch(
      setAnalyticsConsent(data.analytics),
    );
    if (!success) {
      // Nothing was saved, so put the switch back to the saved choice
      form.setValue("analytics", analyticsConsent ?? false);
      toast.error("Failed to save privacy settings. Please try again.");
    } else {
      toast.success("Successfully updated privacy settings");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        <InfoIcon />
        <AlertDescription>
          We use pseudonymous analytics to understand how people use Land
          Explorer and improve the service. This means analytics data may be
          linked to an identifier, but not to your real name.
        </AlertDescription>
      </Alert>
      <Card>
        <CardContent className="flex flex-col">
          <div className="text-foreground flex flex-col gap-3">
            <form id="privacy">
              <FieldGroup>
                <Controller
                  name="analytics"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldLabel htmlFor="allow-analytics">
                          Allow Analytics
                        </FieldLabel>
                        <FieldDescription>
                          {`You currently have analytics ${analyticsConsent ? "enabled" : "disabled"}`}
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id="allow-analytics"
                        name={field.name}
                        checked={field.value}
                        // One save at a time, so an earlier one can't finish last
                        disabled={isSubmitting}
                        onCheckedChange={(checked) => {
                          // Update field value in react-hook-form state
                          field.onChange(checked)
                          // Immediately trigger form submission
                          form.handleSubmit(onSubmit)()
                        }}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
