import { AuthCallback } from "@/components/auth/auth-result";
import { useEffect } from "react";

type AuthCallbackPageProps = { updateBgImage: (n: number) => void };

// Where verification email links land, so no session check: a verified user
// is signed in by now, an expired link's user is not, and both see the result
export default function AuthCallbackPage({ updateBgImage }: AuthCallbackPageProps) {
  useEffect(() => {
    updateBgImage(0);
  }, []);

  return (
    <div className="relative flex grow justify-center items-center">
      <AuthCallback />
    </div>
  );
}
