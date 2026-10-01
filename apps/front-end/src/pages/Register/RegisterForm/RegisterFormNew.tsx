import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getAuthLinkURL,
  isPasswordCompromisedError,
} from "@better-auth-ui/core";
import {
  AuthPrompts,
  useAuth,
  useFetchOptions,
  useSignUpEmail,
} from "@better-auth-ui/react";
import type { BetterFetchError } from "better-auth/react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  defaultValues,
  mapServerErrors,
  RegisterFormValues,
  registerSchema,
  toRegistrationDetails,
} from "./RegisterFormSchema";
import RegisterFormFields from "./RegisterFormFields";

/**
 * Our registration form, submitted through Better Auth's email sign-up.
 *
 * Better Auth only keeps the name, email and password. The rest of the
 * registration details travel in the same request and the back-end's
 * `databaseHooks.user.create.before` hook (apps/back-end/src/utils/auth.ts)
 * validates them and saves them to our `user` table.
 *
 * Better Auth's ErrorToaster shows the message of any failed sign-up, so this
 * form only has to put the back-end's validation errors against their fields.
 */
const RegisterFormNew = () => {
  const {
    authClient,
    basePaths,
    emailAndPassword,
    localization,
    plugins,
    redirectTo,
    viewPaths,
    navigate,
  } = useAuth();

  const { fetchOptions, resetFetchOptions } = useFetchOptions();

  const { mutateAsync: signUpEmail } = useSignUpEmail(authClient, {
    onSuccess: (_data, { email }) => {
      if (emailAndPassword?.requireEmailVerification) {
        sessionStorage.setItem("better-auth-ui.verify-email", email);
        navigate({
          to: getAuthLinkURL(
            `${basePaths.auth}/${viewPaths.auth.verifyEmail}`,
            redirectTo,
          ),
        });
      } else {
        navigate({ to: redirectTo });
      }
    },
  });

  const Captcha = plugins.find(
    (plugin) => plugin.captchaComponent,
  )?.captchaComponent;

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues,
  });

  const agree = useWatch({ control, name: "agree" });

  const submitRegistration = async (data: RegisterFormValues) => {
    try {
      await signUpEmail({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email.trim(),
        password: data.password,
        ...toRegistrationDetails(data),
        fetchOptions,
      });
    } catch (error) {
      resetFetchOptions();

      // The haveIBeenPwned plugin rejects on the password itself,
      // so it belongs against the field rather than in a toast.
      if (isPasswordCompromisedError(error)) {
        setError(
          "password",
          { type: "server", message: localization.auth.passwordCompromised },
          { shouldFocus: true },
        );
        return;
      }

      const serverErrors = (error as BetterFetchError).error?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        const { fieldErrors, unattributed } = mapServerErrors(
          serverErrors as Record<string, string[]>,
          data,
        );
        fieldErrors.forEach(([field, message], i) =>
          setError(field, { type: "server", message }, { shouldFocus: i === 0 }),
        );
        unattributed.forEach((message) => toast.error(message));
      }
    }
  };

  return (
    <Card className="relative mx-auto mt-24 w-[calc(100vw-40px)] gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:w-190">
      <AuthPrompts view="signUp" />
      <CardHeader className="gap-2.5 px-6">
        <CardTitle className="text-2xl font-medium text-primary">
          For everyone. Funded by those who can.
        </CardTitle>
        <CardDescription className="text-sm">
          The core Land Explorer tool is free, always. Organisations that choose
          the Solidarity Tier help fund access for grassroots groups,
          tenants&rsquo; unions and community projects.
        </CardDescription>
        <Link
          to="/auth"
          className="absolute top-2.5 right-2.5 flex size-[25px] items-center justify-center rounded-full bg-[#D8D8D8] text-white hover:bg-[#D8D8D8]/80"
        >
          <FontAwesomeIcon icon={faXmark} className="size-3!" />
        </Link>
      </CardHeader>
      <CardContent className="px-6">
        <form onSubmit={handleSubmit(submitRegistration)}>
          <RegisterFormFields control={control} />
          {Captcha && <div className="mb-4 flex justify-center">{Captcha}</div>}
          <div className="flex justify-center gap-2.5 p-2.5">            
            <Button
              type="submit"
              disabled={!agree || isSubmitting}
              className={cn(
                "rounded-full md:min-w-50",
                // the spinner is the busy signal, keep the button solid
                isSubmitting && "disabled:opacity-100",
              )}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Registering…" : "Register"}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center">
          {localization.auth.alreadyHaveAnAccount}{" "}
          <Link
            to={getAuthLinkURL(
              `${basePaths.auth}/${viewPaths.auth.signIn}`,
              redirectTo,
            )}
            className="text-primary underline-offset-4 hover:underline"
          >
            {localization.auth.signIn}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegisterFormNew;
