import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    fetchOptions: {
        onError: (ctx) => {
            // A 401 on the auth pages is a form error (e.g. a wrong password on
            // sign-in) for the page to show, not an expired session
            if (ctx.response.status === 401 && !window.location.pathname.startsWith("/auth")) {
                window.location.href = "/auth/sign-in"
            }
        },
    }
})
