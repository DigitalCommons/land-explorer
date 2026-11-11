import { ResetLinkSent } from "@/components/auth/reset-link-sent";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

type ResetLinkSentProps = { updateBgImage: (n: number) => void };

export default function ResetLinkSentPage({ updateBgImage }: ResetLinkSentProps) {
    const {data: session, isPending} = useSession(authClient);

    useEffect(() => {
        updateBgImage(2);
    }, []);
    
    // Only on the first load: a background refetch (e.g. on tab focus) would
    // otherwise unmount the form and lose what was typed
    if (isPending) return <Spinner />
    if (session) return <Navigate to="/app" replace />

    return (
    <div className="relative flex grow justify-center items-center">
        <ResetLinkSent/>
    </div>
    )
}
