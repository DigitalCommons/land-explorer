import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"
import { resetToSignIn } from "./reset-to-sign-in"

export const authClient = createAuthClient({
    // email verification uses codes, see the emailOTP plugin in the back-end's utils/auth.ts
    plugins: [emailOTPClient()],
    fetchOptions: {
        onError: (ctx) => {
            // A 401 on the auth pages is a form error (e.g. a wrong password on
            // sign-in) for the page to show, not an expired session
            if (ctx.response.status === 401 && !window.location.pathname.startsWith("/auth")) {
                resetToSignIn()
            }
        },
    }
})
