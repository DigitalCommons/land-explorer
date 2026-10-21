import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Full-width warning strip under the top bar, telling users about the upcoming
 * switch to the new login system.
 */
const PlatformUpdateBanner = () => {
  return (
    <Alert
      variant="warning"
    >
      <TriangleAlertIcon/>
      <AlertTitle>Review your email</AlertTitle>
      <AlertDescription>
        We’re switching LandExplorer to a new login system soon. When it goes
        live, you’ll be asked to log in again and verify your email address. If
        you no longer have access to the email you signed up with, update it in
        My Account before the switch, or you may lose access to your account.
      </AlertDescription>
    </Alert>
  );
};

export default PlatformUpdateBanner;
