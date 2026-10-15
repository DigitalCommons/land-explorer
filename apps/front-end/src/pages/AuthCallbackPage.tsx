import { AuthCallback } from "@/components/auth/auth-result";
import { useEffect } from "react";

type AuthCallbackPageProps = { updateBgImage: (n: number) => void };

// Where verification email links land and expired password reset links.
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
