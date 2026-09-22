// src/components/auth/require-auth.tsx
import { useSession } from "@better-auth-ui/react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "@/lib/auth/auth-client"
import { Spinner } from "../ui/spinner"

export default function RequireAuth() {
  const { data: session, isPending } = useSession(authClient)
  const location = useLocation()

  if (isPending) return <Spinner />  
  if (!session) {
    const redirectTo = `${location.pathname}${location.search}` // TEST THIS - IT SHOULD REDIRECT YOU BACK HERE AFTER LOG IN
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(redirectTo)}`} replace />
  }
  return <Outlet />
}