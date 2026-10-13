import { useAuth, useSignOut } from "@better-auth-ui/react"
import { useEffect, useRef } from "react"
import { Spinner } from "@/components/ui/spinner"
import { resetToSignIn } from "@/lib/auth/reset-to-sign-in"
import { cn } from "@/lib/utils"

export type SignOutProps = {
  className?: string
}

/**
 * Signs the current user out on mount and renders a centered spinner while the operation completes.
 *
 * @param className - Optional additional class names appended to the root element
 * @returns The spinner shown during sign-out
 */
export function SignOut({ className }: SignOutProps) {
  const { authClient } = useAuth()

  const { mutate: signOut } = useSignOut(authClient, {
    onError: () => resetToSignIn(),
    onSuccess: () => resetToSignIn()
  })

  const hasSignedOut = useRef(false)

  useEffect(() => {
    if (hasSignedOut.current) return
    hasSignedOut.current = true

    signOut()
  }, [signOut])

  return <Spinner className={cn("mx-auto my-auto", className)} />
}
