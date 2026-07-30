import axios from "axios";
import { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import Spinner from "../components/common/Spinner";
import GoCardlessModal from "../components/modals/GoCardlessModal";
import TopBar from "../components/top-bar/TopBar";
import constants from "../constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field";
import { emailRegexp, ukPhoneRegexp, ukPostcodeRegexp } from "@/lib/validation";

const registerSchema = z
  .object({
    firstName: z.string().min(3, "Must be at least 3 characters").max(19, "Must be at most 19 characters"),
    lastName: z.string().min(3, "Must be at least 3 characters").max(19, "Must be at most 19 characters"),
    email: z.string().regex(emailRegexp, "Invalid email address"),
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

// Preflight is disabled project-wide (see docs/front-end/Styling-with-shadcn-and-Tailwind.md).
const inputClassName =
  "box-border h-9 !rounded-[7px] border-2 border-[#D4D2D2] bg-[#F5F5F5] px-3 text-[#78838F] font-normal focus-visible:border-primary focus-visible:ring-0";

type Props = { updateBgImage: (n: number) => void };

const Register = ({ updateBgImage }: Props) => {
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [accountType, setAccountType] = useState("free");
  const [formStage, setFormStage] = useState("personal");
  const [mandate, setMandate] = useState<string | undefined>();
  const [goCardlessVisible, setGoCardLessVisible] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues,
  });

  const fieldStateClass = (name: keyof RegisterFormValues) =>
    errors[name] ? "invalid" : dirtyFields[name] ? "valid" : "";

  const [organisationType, organisationCommercial, agree] = useWatch({
    control,
    name: ["organisationType", "organisationCommercial", "agree"] as const,
  });

  useEffect(() => {
    updateBgImage(1);
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    if (accountType === "free") {
      setRegistering(true);
      submitRegistration(data);
    } else {
      if (formStage === "personal") {
        const response = await axios.post(
          `${constants.PAYMENTS_URL}/gocardless/billing/flow`
        );
        const { success, billingRequestFlowID } = response.data;
        if (success) {
          setFormStage("payment");
          // @ts-ignore - setBillingRequestFlowID is not declared (pre-existing bug)
          setBillingRequestFlowID(billingRequestFlowID);
        }
      }
    }
  };

  const handlePaymentSubmit = async () => {
    const { email, firstName, lastName } = getValues();
    const requestData = {
      mandate,
      email,
      firstName,
      lastName,
      subscriptionTypeId: 1,
    };
    const response = await axios.post(
      `${constants.PAYMENTS_URL}/subscription`,
      requestData
    );
    const { success } = response.data;
    if (success) {
      submitRegistration(getValues());
    }
  };

  const submitRegistration = (data: RegisterFormValues) => {
    const organisationSubType =
      data.organisationType === "community-interest"
        ? data.organisationCommunityInterest
        : data.organisationCommercial === "other"
        ? data.organisationCommercialOther
        : data.organisationCommercial;

    const request = {
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
      <Link
        to="/auth"
        className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
      >
        <X className="size-4" />
      </Link>
      <h2 className="mb-2.5 text-left text-2xl font-semibold text-primary!">
        For everyone. Funded by those who can.
      </h2>
      <p className="mt-0 mb-6 text-left text-sm text-muted-foreground">
        The core Land Explorer tool is free, always. Organisations that
        choose the Solidarity Tier help fund access for grassroots groups,
        tenants&rsquo; unions and community projects.
      </p>
      {registerErrors && (
        <div>
          {registerErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}{" "}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground">Account details</h3>
        <div className="mb-6 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          <div>
            <Input
              type="text"
              className={`${inputClassName} ${fieldStateClass("firstName")}`}
              placeholder="First name (Required)"
              maxLength={101}
              {...register("firstName")}
            />
            <FieldError errors={[errors.firstName]} className="mt-1.25 text-left" />
          </div>
          <div>
            <Input
              type="text"
              className={`${inputClassName} ${fieldStateClass("lastName")}`}
              placeholder="Last name (Required)"
              maxLength={101}
              {...register("lastName")}
            />
            <FieldError errors={[errors.lastName]} className="mt-1.25 text-left" />
          </div>
          <div>
            <Input
              type="email"
              className={`${inputClassName} ${fieldStateClass("email")}`}
              placeholder="Email address (Required)"
              autoComplete="username"
              maxLength={101}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} className="mt-1.25 text-left" />
          </div>
          <div>
            <Input
              type="password"
              className={`${inputClassName} ${fieldStateClass("password")}`}
              placeholder="Password (Required)"
              autoComplete="new-password"
              minLength={4}
              maxLength={101}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} className="mt-1.25 text-left" />
          </div>
          <div>
            <Input
              type="tel"
              className={`${inputClassName} ${fieldStateClass("phone")}`}
              placeholder="Telephone"
              maxLength={15}
              {...register("phone")}
            />
            <FieldError errors={[errors.phone]} className="mt-1.25 text-left" />
          </div>
          <div>
            <Input
              type="password"
              className={`${inputClassName} ${fieldStateClass("confirmPassword")}`}
              placeholder="Confirm password (Required)"
              autoComplete="new-password"
              minLength={4}
              maxLength={101}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} className="mt-1.25 text-left" />
          </div>
        </div>

        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground">Organisation details</h3>
        <div className="mb-6 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          <Input
            type="text"
            className={`${inputClassName} ${fieldStateClass("organisation")}`}
            placeholder="Organisation Name"
            maxLength={101}
            {...register("organisation")}
          />
          <Controller
            control={control}
            name="organisationType"
            render={({ field }) => (
              <Select
                name="organisation-type"
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="My organisation is..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community-interest">Community Interest</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {organisationType === "community-interest" && (
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="organisationCommunityInterest"
                render={({ field }) => (
                  <Select
                    name="community-interest"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
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
                )}
              />
            </div>
          )}
          {organisationType === "commercial" && (
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="organisationCommercial"
                render={({ field }) => (
                  <Select
                    name="community-interest"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Commercial type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local-authority">Local Authority</SelectItem>
                      <SelectItem value="power-network">Power Network</SelectItem>
                      <SelectItem value="utility-company">Utility Company</SelectItem>
                      <SelectItem value="other">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          {organisationType === "commercial" && organisationCommercial === "other" && (
            <div className="md:col-span-2">
              <Input
                type="text"
                className={`${inputClassName} ${fieldStateClass("organisationCommercialOther")}`}
                placeholder="Other"
                {...register("organisationCommercialOther")}
              />
            </div>
          )}
          <Input
            type="text"
            className={`${inputClassName} md:col-span-2 ${fieldStateClass("organisationNumber")}`}
            placeholder="Organisation / Charity number"
            maxLength={101}
            {...register("organisationNumber")}
          />
          <Input
            type="text"
            className={`${inputClassName} ${fieldStateClass("address1")}`}
            placeholder="Address 1"
            maxLength={101}
            {...register("address1")}
          />
          <Input
            type="text"
            className={`${inputClassName}`}
            placeholder="Address 2"
            maxLength={101}
            {...register("address2")}
          />
          <Input
            type="text"
            className={`${inputClassName} ${fieldStateClass("city")}`}
            placeholder="City"
            maxLength={101}
            {...register("city")}
          />
          <div>
            <Input
              type="text"
              className={`${inputClassName} ${fieldStateClass("postcode")}`}
              placeholder="Postcode"
              maxLength={7}
              {...register("postcode")}
            />
            <FieldError errors={[errors.postcode]} className="mt-1.25 text-left" />
          </div>
        </div>

        <h3 className="mb-1.25! text-left text-sm font-medium! text-foreground">Access tiers</h3>
        <div className="account-type-container">
          <div
            className={`account-type-card ${accountType == "free" ? "active" : "inactive"
              }`}
            onClick={() => {
              setAccountType("free");
            }}
          >
            <div className="card-inner">
              <p className="account-type-title">Free</p>
              <p className="account-type-text">
                Land Explorer is currently free for everyone!
              </p>
            </div>
          </div>
          <div
            className={`account-type-card ${accountType == "paid" ? "active" : "inactive"
              }`}
            onClick={() => {
              /* disable the payment flow
            this.setState({
              accountType: "paid"
            })
            */
            }}
          >
            <div className="card-inner">
              <p className="account-type-title">Solidarity Supporter</p>
              <p className="account-type-text">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="privacy-policy">
          <label
            className="control control-checkbox"
            style={{ textAlign: "left", fontSize: "14px" }}
          >
            I agree to the{" "}
            <a
              target="_blank"
              className="link-underline"
              href="/privacy-policy.pdf"
            >
              privacy policy
            </a>{" "}and{" "}
            <a
              target="_blank"
              className="link-underline"
              href="https://digitalcommons.coop/terms-of-use/"
            >
              terms of use
            </a>.
            <input
              type="checkbox"
              style={{ display: "inline" }}
              {...register("agree")}
            />
            <div className="control_indicator"></div>
          </label>
          <label
            className="control control-checkbox"
            style={{ textAlign: "left", fontSize: "14px" }}
          >
            Keep me up to date with Land Explorer and Digital Commons
            developments
            <input
              type="checkbox"
              style={{ display: "inline" }}
              {...register("marketing")}
            />
            <div className="control_indicator"></div>
          </label>
        </div>
        <div className="FormControlButtons" style={{ padding: "10px" }}>
          <Link to="/auth">
            <div
              className="button button-cancel button-medium"
              style={{ display: "inline-block" }}
            >
              Cancel
            </div>
          </Link>
          <input
            type="submit"
            value={accountType == "free" ? "Register" : "Next"}
            className="button button-medium"
            disabled={!agree}
            style={{
              paddingTop: 0,
              marginLeft: "10px",
              display: "inline-block",
              opacity: agree ? 1 : 0.5,
            }}
          />
        </div>
      </form>
    </Fragment>
  );

  if (formStage == "payment")
    formDisplay = (
      <Fragment>
        <h2>Payment</h2>
        <p>
          Click the GoCardless button below to set up a direct debit. After the
          direct debit has been set up, please close the gocardless modals and
          press Register to complete registration for Land Explorer.
        </p>
        {
          // @ts-ignore - billingRequestFlowID is not in scope here (pre-existing bug)
          billingRequestFlowID && goCardlessVisible && (
            <GoCardlessModal
              billingRequestFlowID={
                // @ts-ignore
                billingRequestFlowID
              }
              setMandate={(mandate) => setMandate(mandate)}
              closeModal={() => setGoCardLessVisible(false)}
            />
          )
        }
        {mandate ? (
          <p>GoCardless Success!</p>
        ) : (
          <button onClick={() => setGoCardLessVisible(true)}>
            Open GoCardless
          </button>
        )}
        <button
          onClick={handlePaymentSubmit}
          disabled={!mandate}
          type="submit"
          className={
            "button button-medium" + (mandate ? "" : " button-reg-disabled")
          }
          style={{
            paddingTop: 0,
            marginLeft: "10px",
            display: "inline-block",
          }}
        >
          Register
        </button>
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
      <div
        className="registration"
        style={{
          maxWidth: "100vw",
          background: "white",
          textAlign: "center",
          paddingLeft: "24px",
          paddingRight: "24px",
          marginBottom: "200px",
          display: registering ? "none" : "block",
        }}
      >
        {formDisplay}
      </div>
    </div>
  );
};

export default Register;
