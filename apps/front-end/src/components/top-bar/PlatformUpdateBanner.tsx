import { useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Session storage so a dismissed banner stays hidden for this tab but comes
// back on the next visit, as the warning matters until the switch happens.
// Cleared on log out so the next user in the same tab still sees it.
export const PLATFORM_UPDATE_BANNER_STORAGE_KEY =
  "lx.notification.platform-update.hidden";

const getStoredValue = () => {
  try {
    return (
      sessionStorage.getItem(PLATFORM_UPDATE_BANNER_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
};

/**
 * Full-width warning strip under the top bar, telling users about the upcoming
 * switch to the new login system.
 */
const PlatformUpdateBanner = () => {
  const [isDismissed, setIsDismissed] = useState(getStoredValue);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(PLATFORM_UPDATE_BANNER_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Could not save banner state:", error);
    }
  };

  return (
    <Alert
      variant="warning"
      className="rounded-none border-x-0 border-t-0 px-5"
    >
      <TriangleAlertIcon />
      <AlertTitle>Check you can access your email</AlertTitle>
      <AlertDescription>
        <p>
          We’re switching LandExplorer to a new login system soon. When it goes
          live, you’ll be asked to log in again and verify your email address.
          If you no longer have access to the email you signed up with, update
          it in{" "}
          <Link to="/app/my-account/email" className="underline">
            My Account
          </Link>{" "}
          before the switch, or you may lose access to your account.
        </p>
      </AlertDescription>
      <AlertAction className="right-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          className="text-amber-900 hover:bg-amber-100 hover:text-amber-950"
          onClick={handleDismiss}
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
};

export default PlatformUpdateBanner;
