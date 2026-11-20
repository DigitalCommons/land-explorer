import { AuthError } from "@/components/auth/auth-result";
import { ResetPassword } from "@/components/auth/reset-password";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

type ResetPasswordProps = { updateBgImage: (n: number) => void };

// No redirect for signed-in users: the token proves they own the inbox, and
// the reset revokes every session, this one included
export default function ResetPasswordPage({
  updateBgImage,
}: ResetPasswordProps) {
  // An expired or already used reset link lands here with ?error=INVALID_TOKEN
  const [searchParams] = useSearchParams();
  const linkFailed = searchParams.has("error");

  useEffect(() => {
    updateBgImage(2);
  }, []);

  return (
    <div className="relative flex grow flex-col justify-center items-center gap-4">
      {linkFailed ? (
        <AuthError />
      ) : (
        <>
          <Alert variant="info" className="w-full max-w-sm">
            <InfoIcon />
            <AlertDescription>
              For your security, resetting your password will sign you out of
              all devices.
            </AlertDescription>
          </Alert>
          <ResetPassword />
        </>
      )}
    </div>
  );
}
