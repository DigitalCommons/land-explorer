import { useSession } from "@better-auth-ui/react"
import { Navigate, Outlet } from "react-router-dom"
import { authClient } from "@/lib/auth/auth-client"
import { Spinner } from "../ui/spinner"

export default function RequireAuth() {
  const { data: session, isFetching, isPending} = useSession(authClient)
  
  if (isPending || (!session && isFetching)) {
    return (
      <div className="h-screen min-h-screen flex flex-col items-center justify-center grow">
        <Spinner className="text-primary size-8 items-center"></Spinner>
      </div>
    ) 
  }
  if (!session) return <Navigate to="/auth/sign-in" replace />
  return <Outlet />
}
