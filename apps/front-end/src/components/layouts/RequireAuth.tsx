import { useSession } from "@better-auth-ui/react"
import { useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAppSelector } from "@/hooks/react-redux"
import { authClient } from "@/lib/auth/auth-client"
import { resetToSignIn } from "@/lib/auth/reset-to-sign-in"
import { Spinner } from "../ui/spinner"

export default function RequireAuth() {
  const { data: session, isFetching, isPending} = useSession(authClient)
  const userLoaded = useAppSelector((state) => state.user.populated)

  const loading = isPending || (!session && isFetching)
  // The session ended while the app had a user's data loaded (e.g. it expired),
  // so reload rather than navigate, to leave none of that data in memory
  const sessionEnded = !loading && !session && userLoaded

  useEffect(() => {
    if (sessionEnded) {
      resetToSignIn()
    }
  }, [sessionEnded])

  if (loading || sessionEnded) {
    return (
      <div className="h-screen min-h-screen flex flex-col items-center justify-center grow">
        <Spinner className="text-primary size-8 items-center"></Spinner>
      </div>
    )
  }
  if (!session) return <Navigate to="/auth/sign-in" replace />
  return <Outlet />
}
