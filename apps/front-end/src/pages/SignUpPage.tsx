
import RegisterFormNew from "@/pages/Register/RegisterForm/RegisterFormNew";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

type SignUpProps = { updateBgImage: (n: number) => void };

export default function SignUpPage({ updateBgImage }: SignUpProps) {
    const {data: session, isFetching} = useSession(authClient);

    useEffect(() => {
        updateBgImage(1);
    }, []);

    if (!session && isFetching) return <Spinner />
    if (session) return <Navigate to="/app" replace />

    return (
    <div className="relative min-h-0 grow overflow-y-auto pb-50">
        <RegisterFormNew />
    </div>
    )
}
