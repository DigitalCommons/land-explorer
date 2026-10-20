import { getAuthErrorCode } from "@better-auth-ui/core";
import {
  type EmailOtpAuthClient,
  requestEmailChangeOtpOptions,
} from "@better-auth-ui/core/plugins/email-otp";
import { useAuth, useAuthPlugin, useSession } from "@better-auth-ui/react";
import { useChangeEmailOtp } from "@better-auth-ui/react/plugins/email-otp";
import { useSelector } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon } from "lucide-react";
import { useEffect, useReducer } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthErrorDisplayMessage } from "@/lib/auth/auth-error-message";
import { emailOtpPlugin } from "@/lib/auth/email-otp-plugin";
import { cn } from "cn";
import {
  setAuthFormServerError,
  submitAuthForm,
  useAuthForm,
} from "../auth-form";
import { OpenEmailButton } from "../open-email-button";
import { OtpField } from "../otp-field";

type ChangeEmailStep = "email" | "password" | "code" | "changed";

type ChangeEmailState = {
  step: ChangeEmailStep;
  newEmail: string;
};

type ChangeEmailAction =
  | { type: "emailEntered"; newEmail: string }
  | { type: "changeRequested"; newEmail: string }
  | { type: "emailChanged"; newEmail: string }
  | { type: "restarted" };

const initialChangeEmailState: ChangeEmailState = {
  step: "email",
  newEmail: "",
};

// Every step is reachable from the action alone, so the previous state never
// takes part in the transition.
function changeEmailReducer(
  _state: ChangeEmailState,
  action: ChangeEmailAction,
): ChangeEmailState {
  switch (action.type) {
    case "emailEntered":
      return { step: "password", newEmail: action.newEmail };
    case "changeRequested":
      return { step: "code", newEmail: action.newEmail };
    case "emailChanged":
      return { step: "changed", newEmail: action.newEmail };
    case "restarted":
      return initialChangeEmailState;
  }
}

export type ChangeEmailOtpProps = {
  className?: string;
};

/**
 * Change the account email with codes instead of a confirmation link.
 *
 * Replaces the built-in `<ChangeEmail />` card when the email-OTP plugin runs
 * with `changeEmail: true`. The user enters the new address, then their
 * password, which the back end checks before sending a code to the new address
 * (confirmPasswordForEmailChange), then the code.
 *
 * @param className - Additional CSS classes applied to the card.
 */
export function ChangeEmailOtp({ className }: ChangeEmailOtpProps) {
  const { authClient, localization } = useAuth();
  const { localization: emailOtpLocalization, otpLength } =
    useAuthPlugin(emailOtpPlugin);

  const otpClient = authClient as EmailOtpAuthClient;
  const { data: session } = useSession(otpClient);
  const currentEmail = session?.user.email;

  const [state, dispatch] = useReducer(
    changeEmailReducer,
    initialChangeEmailState,
  );

  // useMutation directly rather than useRequestEmailChangeOtp, whose options
  // can't set meta: errors such as a wrong password show in the form, so
  // ErrorToaster needs to leave them alone
  const { mutateAsync: requestEmailChangeOtp, isPending: isRequesting } =
    useMutation({
      ...requestEmailChangeOtpOptions(otpClient),
      meta: { errorPresentation: "inline" },
      onError: (error) => {
        form.setFieldValue("password", "");
        // Better Auth UI's copy for this code talks about sign-in details
        const message =
          getAuthErrorCode(error) === "INVALID_PASSWORD"
            ? "Incorrect password. Please try again."
            : getAuthErrorDisplayMessage(error, localization);
        if (message) setAuthFormServerError(form, message, message);
      },
      onSuccess: (_data, { newEmail }) => {
        dispatch({ type: "changeRequested", newEmail });
      },
    });

  const { mutateAsync: changeEmailOtp, isPending: isChanging } =
    useChangeEmailOtp(otpClient, {
      // Better Auth UI refetches the session before this runs, so the rest of
      // the app shows the new address by the time the confirmation does
      onError: () => form.setFieldValue("code", ""),
      onSuccess: (_data, { newEmail }) => {
        form.reset();
        dispatch({ type: "emailChanged", newEmail });
      },
    });

  const isPending = isRequesting || isChanging;

  const form = useAuthForm({
    defaultValues: { code: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      if (state.step === "email") {
        dispatch({ type: "emailEntered", newEmail: value.email });
        return;
      }

      if (state.step === "password") {
        // The back end checks the password before sending a code to the new
        // address (confirmPasswordForEmailChange). Better Auth's types don't
        // include it, so it's added to the request body through fetchOptions
        await requestEmailChangeOtp({
          newEmail: state.newEmail,
          fetchOptions: { body: { password: value.password } },
        });
        return;
      }

      if (state.step === "code" && !isPending) {
        await changeEmailOtp({ newEmail: state.newEmail, otp: value.code });
      }
    },
  });
  const codeComplete = useSelector(
    form.store,
    (formState) => formState.values.code.length === otpLength,
  );
  // Better Auth refuses a change to the same address, so catch it before the
  // password step rather than after
  const emailUnchanged = useSelector(
    form.store,
    (formState) =>
      formState.values.email.trim().toLowerCase() ===
      currentEmail?.toLowerCase(),
  );

  const resetFlow = () => {
    form.reset();
    if (currentEmail) form.setFieldValue("email", currentEmail);
    dispatch({ type: "restarted" });
  };

  useEffect(() => {
    if (currentEmail) form.setFieldValue("email", currentEmail);
  }, [currentEmail, form]);

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">
        {localization.settings.changeEmail}
      </h2>

      <form.AppForm>
        <form.AuthFormRoot>
          <Card className={cn(className)}>
            <CardContent className="flex flex-col gap-6">
              {state.step === "email" && (
                <form.AppField name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="email">
                        {localization.auth.email}
                      </FieldLabel>

                      {session ? (
                        <Input
                          key={currentEmail}
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={field.state.value}
                          placeholder={localization.auth.emailPlaceholder}
                          disabled={isPending}
                          required
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      ) : (
                        <Skeleton>
                          <Input className="invisible" />
                        </Skeleton>
                      )}

                      <field.AuthFormFieldError />
                    </Field>
                  )}
                </form.AppField>
              )}

              {state.step === "password" && (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">
                    {`Enter your password to change your email address to ${state.newEmail}.`}
                  </p>

                  <form.AppField name="password">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="password">
                          {localization.settings.currentPassword}
                        </FieldLabel>

                        <Input
                          autoFocus
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          value={field.state.value}
                          placeholder={
                            localization.settings.currentPasswordPlaceholder
                          }
                          disabled={isPending}
                          required
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />

                        <field.AuthFormFieldError />
                      </Field>
                    )}
                  </form.AppField>

                  <form.AuthFormServerError />
                </div>
              )}

              {state.step === "code" && (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">
                    {emailOtpLocalization.confirmEmailDescription.replace(
                      "{{email}}",
                      state.newEmail,
                    )}
                  </p>

                  <form.AppField name="code">
                    {(field) => (
                      <OtpField
                        autoFocus
                        disabled={isPending}
                        label={emailOtpLocalization.confirmNewEmail}
                        length={otpLength}
                        name="otp"
                        value={field.state.value}
                        onChange={field.handleChange}
                        onComplete={() => void submitAuthForm(form)}
                      />
                    )}
                  </form.AppField>

                  <form.AuthFormServerError />

                  <OpenEmailButton email={state.newEmail} variant="secondary" />
                </div>
              )}

              {state.step === "changed" && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>Email address changed</AlertTitle>
                  <AlertDescription>
                    {`You'll now sign in with ${state.newEmail}.`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="gap-3">
              {state.step === "changed" ? (
                <Button type="button" size="sm" onClick={resetFlow}>
                  Done
                </Button>
              ) : (
                <>
                  {state.step !== "email" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={resetFlow}
                    >
                      {localization.settings.cancel}
                    </Button>
                  )}

                  <form.AuthFormSubmitButton
                    isPending={isPending}
                    size="sm"
                    disabled={
                      isPending ||
                      !session ||
                      (state.step === "email" && emailUnchanged) ||
                      (state.step === "code" && !codeComplete)
                    }
                  >
                    {state.step === "email"
                      ? localization.settings.updateEmail
                      : state.step === "password"
                        ? emailOtpLocalization.sendCode
                        : emailOtpLocalization.verifyCode}
                  </form.AuthFormSubmitButton>
                </>
              )}
            </CardFooter>
          </Card>
        </form.AuthFormRoot>
      </form.AppForm>
    </div>
  );
}
