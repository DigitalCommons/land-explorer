import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { VerifyEmail } from "@/components/auth/verify-email";

type VerifyEmailProps = { updateBgImage: (n: number) => void };

export default function VerifyEmailPage({ updateBgImage }: VerifyEmailProps) {
  // A refetch on window focus remounts VerifyEmail and restarts its resend cooldown
  const { data: session, isPending } = useSession(authClient, { refetchOnWindowFocus: false });

  useEffect(() => {
    updateBgImage(0);
  }, []);

  if (isPending) return <Spinner />;
  if (session) return <Navigate to="/app" replace />;

  return (
    <div className="relative flex grow justify-center items-center">
      <VerifyEmail />
    </div>
  );
}
