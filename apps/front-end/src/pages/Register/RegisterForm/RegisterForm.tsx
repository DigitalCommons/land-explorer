import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TierCard from "../../../components/common/TierCard/TierCard";
import constants from "../../../constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ukPhoneRegexp, ukPostcodeRegexp } from "@/lib/validation";

const maxCharsMessage = (n: number) => `Must not exceed ${n} characters`;
const maxChars = (n: number) => z.string().max(n, maxCharsMessage(n));

const registerSchema = z
  .object({
    firstName: maxChars(100).min(1, "Please enter your first name"),
    lastName: maxChars(100).min(1, "Please enter your last name"),
    email: z.email("Invalid email address").max(100, maxCharsMessage(100)),
    password: maxChars(100).min(6, "Must be at least 6 characters"),
    confirmPassword: z.string(),
    phone: maxChars(20).refine(
      (v) => v === "" || ukPhoneRegexp.test(v),
      "Invalid UK phone number",
    ),
    organisationNumber: maxChars(100),
    address1: maxChars(100),
    address2: maxChars(100),
    city: maxChars(100),
    postcode: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || ukPostcodeRegexp.test(v),
        "Invalid UK postcode",
      ),
    organisation: maxChars(100),
    organisationType: z.string(),
    organisationCommunityInterest: z.string(),
    organisationCommercial: z.string(),
    organisationCommercialOther: maxChars(100),
    agree: z.boolean(),
    marketing: z.boolean(),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const defaultValues: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  organisationNumber: "",
  address1: "",
  address2: "",
  city: "",
  postcode: "",
  organisation: "",
  organisationType: "",
  organisationCommunityInterest: "",
  organisationCommercial: "",
  organisationCommercialOther: "",
  agree: false,
  marketing: false,
};

const organisationTypeItems = {
  "community-interest": "Community Interest",
  commercial: "Commercial",
};

const organisationCommunityInterestItems = {
  "community-energy": "Community Energy",
  "community-growing": "Community Growing or Rural Enterprise",
  "community-group": "Community Group (other)",
  coop: "Co-op",
  "neighbourhood-planning": "Neighbourhood Planning",
  "renters-union": "Renters Union",
  "woodland-enterprise": "Woodland Enterprise",
};

const organisationCommercialItems = {
  "local-authority": "Local Authority",
  "power-network": "Power Network",
  "utility-company": "Utility Company",
  other: "Other (please specify)",
};

// the back-end (apps/back-end/src/validation.ts) calls it "username"; its other
// validation keys match form field names, apart from organisationSubType, which
// is resolved per organisation type at submit time
const serverFieldRenames: Partial<Record<string, keyof RegisterFormValues>> = {
  username: "email",
};

const resolveField = (key: string, subTypeField: keyof RegisterFormValues) =>
  key === "organisationSubType"
    ? subTypeField
    : serverFieldRenames[key] ??
      (key in defaultValues ? (key as keyof RegisterFormValues) : undefined);

type Props = {
  setRegistering: (registering: boolean) => void;
  setRegisterSuccess: (registerSuccess: boolean) => void;
};

const RegisterForm = ({ setRegistering, setRegisterSuccess }: Props) => {
  const [accountType, setAccountType] = useState("free");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const { control, handleSubmit, setError } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues,
  });

  const [organisationType, organisationCommercial, agree] = useWatch({
    control,
    name: ["organisationType", "organisationCommercial", "agree"] as const,
  });

  const dismissErrors = () => setErrorMessages([]);

  const onSubmit = (data: RegisterFormValues) => {
    setRegistering(true);
    submitRegistration(data);
  };

  // #157: accountType is saved to the DB as there's currently no payment gateway
  // this can allow for manual follow-up of paying users
  const submitRegistration = (data: RegisterFormValues) => {
    const organisationSubTypeField: keyof RegisterFormValues =
      data.organisationType === "community-interest"
        ? "organisationCommunityInterest"
        : data.organisationCommercial === "other"
          ? "organisationCommercialOther"
          : "organisationCommercial";
    const organisationSubType = data[organisationSubTypeField] as string;

    const request = {
      accountType,
      address1: data.address1,
      address2: data.address2,
      city: data.city, // #158
      firstName: data.firstName,
      lastName: data.lastName,
      marketing: data.marketing,
      organisation: data.organisation,
      organisationNumber: data.organisationNumber,
      organisationType: data.organisationType,
      organisationSubType,
      password: data.password,
      phone: data.phone,
      postcode: data.postcode,
      username: data.email,
    };
    axios
      .post(`${constants.ROOT_URL}/api/user/register`, request)
      .then(() => {
        setRegisterSuccess(true);
      })
      .catch((err: any) => {
        const { response } = err;
        if (
          response?.status === 400 &&
          typeof response.data === "object" &&
          response.data !== null
        ) {
          const unattributed: string[] = [];
          let focused = false;
          Object.entries(response.data as Record<string, string[]>).forEach(
            ([key, messages]) => {
              const field = resolveField(key, organisationSubTypeField);
              if (field) {
                setError(
                  field,
                  { type: "server", message: messages.join(" ") },
                  { shouldFocus: !focused },
                );
                focused = true;
              } else {
                unattributed.push(...messages);
              }
            },
          );
          setErrorMessages(unattributed);
        } else {
          // no response means the request never landed, so the connection is
          // worth checking; anything else came from the server, where trying
          // again now would not help
          const unreachable =
            err.code === "ERR_NETWORK" || err.code === "ECONNABORTED";
          setErrorMessages([
            unreachable
              ? "We could not reach the server. Check your internet connection and try again."
              : "We could not complete your registration at the moment. Please try again later.",
          ]);
        }
      })
      .finally(() => {
        setRegistering(false);
      });
  };

  return (
    <Card className="relative mx-auto mt-24 w-[calc(100vw-40px)] gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:w-190">
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <h3 className="mb-3! text-primary!">Account details</h3>
          <div className="mb-8 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
            <Controller
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="firstName" className="text-left">
                    First name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="firstName"
                    type="text"
                    placeholder="First name (Required)"
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
              control={control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="lastName" className="text-left">
                    Last name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="lastName"
                    type="text"
                    placeholder="Last name (Required)"
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
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="email" className="text-left">
                    Email address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Email address (Required)"
                    autoComplete="username"
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
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="phone" className="text-left">
                    Telephone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="Telephone"
                    maxLength={20}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="password" className="text-left">
                    Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (Required)"
                      autoComplete="new-password"
                      minLength={4}
                      maxLength={101}
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="confirmPassword" className="text-left">
                    Confirm password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password (Required)"
                      autoComplete="new-password"
                      minLength={4}
                      maxLength={101}
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground"
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <h3 className="mb-3! text-primary!">Organisation details</h3>
          <div className="mb-8 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
            <Controller
              control={control}
              name="organisation"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="organisation" className="text-left">
                    Organisation name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="organisation"
                    type="text"
                    placeholder="Organisation Name"
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
              control={control}
              name="organisationNumber"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
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
              control={control}
              name="address1"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="address1" className="text-left">
                    Address line 1
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address1"
                    type="text"
                    placeholder="Address 1"
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
              control={control}
              name="address2"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="address2" className="text-left">
                    Address line 2
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address2"
                    type="text"
                    placeholder="Address 2"
                    maxLength={101}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="city" className="text-left">
                    City
                  </FieldLabel>
                  <Input
                    {...field}
                    id="city"
                    type="text"
                    placeholder="City"
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
              control={control}
              name="postcode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="postcode" className="text-left">
                    Postcode
                  </FieldLabel>
                  <Input
                    {...field}
                    id="postcode"
                    type="text"
                    placeholder="Postcode"
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
              control={control}
              name="organisationType"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
                  <FieldLabel htmlFor="organisationType" className="text-left">
                    Organisation type
                  </FieldLabel>
                  <Select
                    name="organisation-type"
                    items={organisationTypeItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="organisationType"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="My organisation is..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(organisationTypeItems).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {organisationType === "community-interest" && (
              <Controller
                control={control}
                name="organisationCommunityInterest"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.25">
                    <FieldLabel
                      htmlFor="organisationCommunityInterest"
                      className="text-left"
                    >
                      Community interest type
                    </FieldLabel>
                    <Select
                      name="community-interest"
                      items={organisationCommunityInterestItems}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="organisationCommunityInterest"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Community interest type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(organisationCommunityInterestItems).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            {organisationType === "commercial" && (
              <Controller
                control={control}
                name="organisationCommercial"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.25">
                    <FieldLabel
                      htmlFor="organisationCommercial"
                      className="text-left"
                    >
                      Commercial type
                    </FieldLabel>
                    <Select
                      name="commercial"
                      items={organisationCommercialItems}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="organisationCommercial"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Commercial type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(organisationCommercialItems).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            {organisationType === "commercial" &&
              organisationCommercial === "other" && (
                <Controller
                  control={control}
                  name="organisationCommercialOther"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="gap-1.25"
                    >
                      <FieldLabel
                        htmlFor="organisationCommercialOther"
                        className="text-left"
                      >
                        Other organisation type
                      </FieldLabel>
                      <Input
                        {...field}
                        id="organisationCommercialOther"
                        type="text"
                        placeholder="Other"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
          </div>

          <h3 className="mb-3! text-primary!">Access tiers</h3>
          <div className="mb-6 flex flex-col gap-3 md:flex-row">
            <TierCard
              tierType="Free"
              name="Community Tier"
              price="Always free"
              description="Core Land Explorer access."
              selected={accountType == "free"}
              detailsHref="https://landexplorer.coop/#PB2L8SM7jqBqJSzQ"
              onSelect={() => setAccountType("free")}
            />
            <TierCard
              tierType="Paid"
              name="Solidarity Tier"
              price="£600 (incl VAT) per year"
              description="Helps fund free access for others."
              selected={accountType == "paid"}
              detailsHref="https://landexplorer.coop/#PB2L8SM7jqBqJSzQ"
              onSelect={() => setAccountType("paid")}
            />
          </div>

          <FieldGroup className="mb-4 gap-1.25">
            <Controller
              control={control}
              name="agree"
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <Checkbox
                    id="agree"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel
                    htmlFor="agree"
                    className="block text-sm font-normal"
                  >
                    I agree to the{" "}
                    <a
                      target="_blank"
                      className="link-underline"
                      href="/privacy-policy.pdf"
                    >
                      privacy policy
                    </a>{" "}
                    and{" "}
                    <a
                      target="_blank"
                      className="link-underline"
                      href="https://digitalcommons.coop/terms-of-use/"
                    >
                      terms of use
                    </a>
                    .
                  </FieldLabel>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="marketing"
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <Checkbox
                    id="marketing"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel
                    htmlFor="marketing"
                    className="text-sm font-normal"
                  >
                    Keep me up to date with Land Explorer and Digital Commons
                    developments
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
          <div className="flex justify-center gap-2.5 p-2.5">
            <Link
              to="/auth"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full md:min-w-50",
              )}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={!agree}
              className="rounded-full md:min-w-50"
            >
              Register
            </Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog
        open={errorMessages.length > 0}
        onOpenChange={(open) => !open && dismissErrors()}
      >
        <AlertDialogContent className="ring-destructive/40">
          <AlertDialogHeader>
            <AlertDialogMedia className="size-auto bg-transparent text-destructive">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="size-6!"
              />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-destructive!">
              Registration error
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              {errorMessages.join(" ")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-destructive/30 bg-destructive/15">
            <AlertDialogAction
              onClick={dismissErrors}
              variant="secondary"
              className="border-destructive/50 px-6 pb-0.5"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RegisterForm;
