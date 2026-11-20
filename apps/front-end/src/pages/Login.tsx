import { SignIn } from "@/components/auth/sign-in";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

type LoginProps = { updateBgImage: (n: number) => void };

export default function Login({ updateBgImage }: LoginProps) {
    const {data: session, isPending} = useSession(authClient);

    useEffect(() => {
        updateBgImage(0);
    }, []);
    
    // Only on the first load: a background refetch (e.g. on tab focus) would
    // otherwise unmount the form and lose what was typed
    if (isPending) return <Spinner />
    if (session) return <Navigate to="/app" replace />

    return (
    <div className="relative flex grow justify-center items-center">
        <SignIn/>
    </div>
    )
}
