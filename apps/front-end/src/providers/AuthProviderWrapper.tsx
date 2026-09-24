import { AuthProvider } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth/auth-client";
import { QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";

type AuthProviderWrapperProps = {
    client: QueryClient
} & PropsWithChildren

export default function AuthProviderWrapper({children, client}: AuthProviderWrapperProps) {
    const navigate = useNavigate();

    return (
        <AuthProvider        
            authClient={authClient}
            queryClient={client}
            redirectTo="app"            
            emailAndPassword={{ minPasswordLength: 6, rememberMe: true }}
            viewPaths={{auth: {
                signIn: "sign-in",
                signUp: "register",
                forgotPassword: "forgot-password",  
                resetLinkSent: "reset-link-sent",    
                resetPassword: "reset-password",          
                signOut: "sign-out",               
            }}}            
            navigate={({ to, replace }) => navigate(to, {replace: replace})}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
        >
            {children}
        </AuthProvider>
    )
}
