import axios from "axios";
import { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import Spinner from "../components/common/Spinner";
import TierCard from "../components/common/TierCard/TierCard";
import TopBar from "../components/top-bar/TopBar";
import constants from "../constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ukPhoneRegexp, ukPostcodeRegexp } from "@/lib/validation";

const registerSchema = z
  .object({
    firstName: z.string().min(3, "Must be at least 3 characters").max(19, "Must be at most 19 characters"),
    lastName: z.string().min(3, "Must be at least 3 characters").max(19, "Must be at most 19 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Must be at least 6 characters").max(29, "Must be at most 29 characters"),
    confirmPassword: z.string(),
    phone: z.string().refine((v) => v === "" || ukPhoneRegexp.test(v), "Invalid UK phone number"),
    organisationNumber: z.string(),
    address1: z.string(),
    address2: z.string(),
    city: z.string(),
    postcode: z.string().refine((v) => v === "" || ukPostcodeRegexp.test(v), "Invalid UK postcode"),
    organisation: z.string(),
    organisationType: z.string(),
    organisationCommunityInterest: z.string(),
    organisationCommercial: z.string(),
    organisationCommercialOther: z.string(),
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

type Props = { updateBgImage: (n: number) => void };

const Register = ({ updateBgImage }: Props) => {
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [accountType, setAccountType] = useState("free");

  const {
    control,
    handleSubmit,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues,
  });

  const [organisationType, organisationCommercial, agree] = useWatch({
    control,
    name: ["organisationType", "organisationCommercial", "agree"] as const,
  });

  useEffect(() => {
    updateBgImage(1);
  }, []);

  const onSubmit = (data: RegisterFormValues) => {
    setRegistering(true);
    submitRegistration(data);
  };

  // No payment gateway is wired in yet. Paid-tier signups still register immediately;
  // `accountType` on the submitted request is how they're followed up with about payment.
  const submitRegistration = (data: RegisterFormValues) => {
    const organisationSubType =
      data.organisationType === "community-interest"
        ? data.organisationCommunityInterest
        : data.organisationCommercial === "other"
        ? data.organisationCommercialOther
        : data.organisationCommercial;

    const request = {
      accountType,
      address: data.address1,
      firstName: data.firstName,
      lastName: data.lastName,
      marketing: data.marketing,
      organisation: data.organisation,
      organisationNumber: data.organisationNumber,
      organisationType: data.organisationType,
      organisationSubType,
      password: data.password,
      phone: data.phone,
      username: data.email,
    };
    console.log("registration request", request);
    axios
      .post(`${constants.ROOT_URL}/api/user/register`, request)
      .then((response) => {
        console.log("register response", response);
        setRegisterSuccess(true);
        setRegistering(false);
      })
      .catch((err: any) => {
        console.log(err.message);
        //Catch err 400 here
        const { response } = err;
        if (response?.status === 400) {
          console.log("Hey we get some custom error message from server:");
          console.log(response.data);

          if (response.data.username)
            Swal.fire({ icon: "error", text: response.data.username[0] });
        }
        setRegistering(false);
      });
  };

  let formDisplay = (
    <Fragment>
      <CardHeader className="gap-2.5 px-6">
        <CardTitle className="text-left text-2xl font-medium text-primary">
          For everyone. Funded by those who can.
        </CardTitle>
        <CardDescription className="text-left text-sm">
          The core Land Explorer tool is free, always. Organisations that
          choose the Solidarity Tier help fund access for grassroots groups,
          tenants&rsquo; unions and community projects.
        </CardDescription>
        <CardAction>
          <Link
            to="/auth"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <X className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="px-6">
        {registerErrors && (
          <div>
            {registerErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}{" "}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground!">Account details</h3>
        <div className="mb-6 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          <Controller
            control={control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="firstName" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="lastName" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="email" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="password" className="sr-only">
                  Password
                </FieldLabel>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  placeholder="Password (Required)"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={101}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="phone" className="sr-only">
                  Telephone
                </FieldLabel>
                <Input
                  {...field}
                  id="phone"
                  type="tel"
                  placeholder="Telephone"
                  maxLength={15}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25">
                <FieldLabel htmlFor="confirmPassword" className="sr-only">
                  Confirm password
                </FieldLabel>
                <Input
                  {...field}
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password (Required)"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={101}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
        </div>

        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground!">Organisation details</h3>
        <div className="mb-6 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          <Controller
            control={control}
            name="organisation"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-1">
                <FieldLabel htmlFor="organisation" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="organisationType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-2">
                <FieldLabel htmlFor="organisationType" className="sr-only">
                  Organisation type
                </FieldLabel>
                <Select
                  name="organisation-type"
                  items={organisationTypeItems}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger id="organisationType" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="My organisation is..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community-interest">Community Interest</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          {organisationType === "community-interest" && (
            <Controller
              control={control}
              name="organisationCommunityInterest"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-4">
                  <FieldLabel htmlFor="organisationCommunityInterest" className="sr-only">
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
                      <SelectItem value="community-energy">Community Energy</SelectItem>
                      <SelectItem value="community-growing">
                        Community Growing or Rural Enterprise
                      </SelectItem>
                      <SelectItem value="community-group">Community Group (other)</SelectItem>
                      <SelectItem value="coop">Co-op</SelectItem>
                      <SelectItem value="neighbourhood-planning">
                        Neighbourhood Planning
                      </SelectItem>
                      <SelectItem value="renters-union">Renters Union</SelectItem>
                      <SelectItem value="woodland-enterprise">Woodland Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
                </Field>
              )}
            />
          )}
          {organisationType === "commercial" && (
            <Controller
              control={control}
              name="organisationCommercial"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-4">
                  <FieldLabel htmlFor="organisationCommercial" className="sr-only">
                    Commercial type
                  </FieldLabel>
                  <Select
                    name="community-interest"
                    items={organisationCommercialItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="organisationCommercial" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Commercial type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local-authority">Local Authority</SelectItem>
                      <SelectItem value="power-network">Power Network</SelectItem>
                      <SelectItem value="utility-company">Utility Company</SelectItem>
                      <SelectItem value="other">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
                </Field>
              )}
            />
          )}
          {organisationType === "commercial" && organisationCommercial === "other" && (
            <Controller
              control={control}
              name="organisationCommercialOther"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-5">
                  <FieldLabel htmlFor="organisationCommercialOther" className="sr-only">
                    Other organisation type
                  </FieldLabel>
                  <Input
                    {...field}
                    id="organisationCommercialOther"
                    type="text"
                    placeholder="Other"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
                </Field>
              )}
            />
          )}
          <Controller
            control={control}
            name="organisationNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-3">
                <FieldLabel htmlFor="organisationNumber" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="address1"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-6">
                <FieldLabel htmlFor="address1" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="address2"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-7">
                <FieldLabel htmlFor="address2" className="sr-only">
                  Address line 2
                </FieldLabel>
                <Input {...field} id="address2" type="text" placeholder="Address 2" maxLength={101} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-8">
                <FieldLabel htmlFor="city" className="sr-only">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="postcode"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.25 md:order-9">
                <FieldLabel htmlFor="postcode" className="sr-only">
                  Postcode
                </FieldLabel>
                <Input
                  {...field}
                  id="postcode"
                  type="text"
                  placeholder="Postcode"
                  maxLength={7}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-left" />}
              </Field>
            )}
          />
        </div>

        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground!">Access tiers</h3>
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
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="agree"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor="agree" className="block text-left text-sm font-normal">
                  I agree to the{" "}
                  <a target="_blank" className="link-underline" href="/privacy-policy.pdf">
                    privacy policy
                  </a>{" "}
                  and{" "}
                  <a
                    target="_blank"
                    className="link-underline"
                    href="https://digitalcommons.coop/terms-of-use/"
                  >
                    terms of use
                  </a>.
                </FieldLabel>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="marketing"
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="marketing"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor="marketing" className="text-left text-sm font-normal">
                  Keep me up to date with Land Explorer and Digital Commons developments
                </FieldLabel>
              </Field>
            )}
          />
        </FieldGroup>
        <div className="p-2.5">
          <Link
            to="/auth"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full md:min-w-50")}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={!agree} className="ml-2.5 rounded-full md:min-w-50">
            Register
          </Button>
        </div>
      </form>
      </CardContent>
    </Fragment>
  );

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "scroll",
        position: "relative",
      }}
    >
      <TopBar limited={true} />
      <div
        style={{
          display: registering ? "block" : "none",
          left: "50%",
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          position: "absolute",
          textAlign: "center",
        }}
      >
        <Spinner />
      </div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "white",
          display: registerSuccess ? "block" : "none",
          zIndex: 1,
        }}
      >
        <div
          style={{
            left: "50%",
            top: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            position: "absolute",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p>Registration Successful</p>
          <Link to="/auth/" className="button button-small">
            Ok
          </Link>
        </div>
      </div>
      <div style={{ marginBottom: "200px", display: registering ? "none" : "block" }}>
        <Card className="relative mx-auto mt-24 w-[calc(100vw-40px)] gap-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:w-190">
          {formDisplay}
        </Card>
      </div>
    </div>
  );
};

export default Register;
