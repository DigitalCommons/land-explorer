import { ukPhoneRegexp, ukPostcodeRegexp } from "@/lib/validation";
import { z } from "zod";

const maxCharsMessage = (n: number) => `Must not exceed ${n} characters`;
const maxChars = (n: number) => z.string().max(n, maxCharsMessage(n));

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registerSchema = z
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
    // #157: accountType is saved to the DB as there's currently no payment gateway
    // this can allow for manual follow-up of paying users
    accountType: z.enum(["free", "paid"]),
    agree: z.boolean(),
    marketing: z.boolean(),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const defaultValues: RegisterFormValues = {
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
  accountType: "free",
  agree: false,
  marketing: false,
};

// which form field holds the organisation sub-type
export const subTypeField = (
  data: RegisterFormValues,
): keyof RegisterFormValues => {
  if (data.organisationType === "community-interest")
    return "organisationCommunityInterest";
  if (data.organisationCommercial === "other")
    return "organisationCommercialOther";
  return "organisationCommercial";
};

/**
 * The registration fields the back-end stores on our `user` table, in the
 * shape its validation (apps/back-end/src/validation.ts) expects, minus the
 * email and password, which betterauth sends in its own way.
 */
export const toRegistrationDetails = (data: RegisterFormValues) => ({
  accountType: data.accountType,
  address1: data.address1,
  address2: data.address2,
  city: data.city, // #158
  firstName: data.firstName,
  lastName: data.lastName,
  marketing: data.marketing,
  organisation: data.organisation,
  organisationNumber: data.organisationNumber,
  organisationType: data.organisationType,
  organisationSubType: data[subTypeField(data)] as string,
  phone: data.phone,
  postcode: data.postcode,
});

// the back-end (apps/back-end/src/validation.ts) calls it "username"; its other
// validation keys match form field names, apart from organisationSubType, which
// is resolved per organisation type at submit time
const serverFieldRenames: Partial<Record<string, keyof RegisterFormValues>> = {
  username: "email",
};

const resolveField = (key: string, data: RegisterFormValues) =>
  key === "organisationSubType"
    ? subTypeField(data)
    : serverFieldRenames[key] ??
      (key in defaultValues ? (key as keyof RegisterFormValues) : undefined);

/**
 * Splits the back-end's validation errors into those that belong to a form
 * field and those that don't.
 */
export const mapServerErrors = (
  errors: Record<string, string[]>,
  data: RegisterFormValues,
) => {
  const fieldErrors: [keyof RegisterFormValues, string][] = [];
  const unattributed: string[] = [];
  Object.entries(errors).forEach(([key, messages]) => {
    const field = resolveField(key, data);
    if (field) {
      fieldErrors.push([field, messages.join(" ")]);
    } else {
      unattributed.push(...messages);
    }
  });
  return { fieldErrors, unattributed };
};
