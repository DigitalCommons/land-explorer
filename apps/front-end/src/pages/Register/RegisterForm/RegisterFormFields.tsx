import { useState } from "react";
import { Control, Controller, useWatch } from "react-hook-form";
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
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { RegisterFormValues } from "./RegisterFormSchema";

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

type Props = {
  control: Control<RegisterFormValues>;  
};

/**
 * The registration fields used by the Better Auth reg form.
 */
const RegisterFormFields = ({ control }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [organisationType, organisationCommercial] = useWatch({
    control,
    name: ["organisationType", "organisationCommercial"] as const,
  });

  return (
    <>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PasswordStrengthMeter password={field.value} />              
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="organisationNumber"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.25">
              <FieldLabel htmlFor="organisationNumber" className="text-left">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                <Field data-invalid={fieldState.invalid} className="gap-1.25">
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
      <Controller
        control={control}
        name="accountType"
        render={({ field, fieldState }) => (
          <div className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <TierCard
                tierType="Free"
                name="Community Tier"
                price="Always free"
                description="Core Land Explorer access."
                selected={field.value === "free"}
                detailsHref={constants.TIERS_URL}
                onSelect={() => field.onChange("free")}
              />
              <TierCard
                tierType="Paid"
                name="Solidarity Tier"
                price="£600 (incl VAT) per year"
                description="Helps fund free access for others."
                selected={field.value === "paid"}
                detailsHref={constants.TIERS_URL}
                onSelect={() => field.onChange("paid")}
              />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        )}
      />

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
              <FieldLabel htmlFor="agree" className="block text-sm font-normal">
                I agree to the{" "}
                <a
                  target="_blank"
                  className="text-primary hover:underline"
                  href="/privacy-policy.pdf"
                >
                  privacy policy
                </a>{" "}
                and{" "}
                <a
                  target="_blank"
                  className="text-primary hover:underline"
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
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="marketing"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.invalid}
              />
              <FieldLabel htmlFor="marketing" className="text-sm font-normal">
                Keep me up to date with Land Explorer and Digital Commons
                developments
              </FieldLabel>
            </Field>
          )}
        />
      </FieldGroup>
    </>
  );
};

export default RegisterFormFields;
