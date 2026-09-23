import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({         
    fetchOptions: {
        onError: (ctx) => {
            if (ctx.response.status === 401) {
                window.location.href = "/auth"
        }},             
    }
})