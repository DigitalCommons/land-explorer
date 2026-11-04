
import { AuthError } from "@/components/auth/auth-result";
import { ResetPassword } from "@/components/auth/reset-password";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

type ResetPasswordProps = { updateBgImage: (n: number) => void };

export default function ResetPasswordPage({ updateBgImage }: ResetPasswordProps) {
    const {data: session, isFetching} = useSession(authClient);
    // An expired or already used reset link lands here with ?error=INVALID_TOKEN
    const [searchParams] = useSearchParams();
    const linkFailed = searchParams.has("error");

    useEffect(() => {
        updateBgImage(2);
    }, []);
    
    if (!session && isFetching) return <Spinner />
    if (session) return <Navigate to="/app" replace />

    return (
    <div className="relative flex grow justify-center items-center">
        {linkFailed ? <AuthError/> : <ResetPassword/>}
    </div>
    )
}
