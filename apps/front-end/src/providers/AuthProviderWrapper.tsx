import { AuthProvider } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth/auth-client";
import { ComponentProps, PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";

// Defined once at module level so React sees a stable component type across renders
const RouterLink: ComponentProps<typeof AuthProvider>["Link"] = ({ href, ...props }) => <Link to={href} {...props} />;

export default function AuthProviderWrapper({children}: PropsWithChildren) {
    const navigate = useNavigate();

    return (
        <AuthProvider
            authClient={authClient}
            redirectTo="/app"            
            emailAndPassword={{ minPasswordLength: 6, rememberMe: true, requireEmailVerification: true }}
            viewPaths={{auth: {
                signUp: "/register",
                signIn: "/",
                //forgotPassword: ""
                //resetPassword: ""
                //signOut: ""
                verifyEmail: "/verify"
            }}}
            navigate={({ to, replace }) => navigate(to, {replace: replace})}
            Link={RouterLink}
        >
            {children}
        </AuthProvider>
    )
}
