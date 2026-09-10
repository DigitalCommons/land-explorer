import { AuthProvider } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth/auth-client";
import { PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";


export default function AuthProviderWrapper({children}: PropsWithChildren) {
    const navigate = useNavigate();

    return (
        <AuthProvider
            authClient={authClient}
            redirectTo="/settings/account"
            socialProviders={["google", "github"]}
            emailAndPassword={{ requireEmailVerification: true, minPasswordLength: 6 }}
            navigate={({ to, replace }) => navigate(to, {replace: replace})}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
        >
            {children}
        </AuthProvider>
    )
}
