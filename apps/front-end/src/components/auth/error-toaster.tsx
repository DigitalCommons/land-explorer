import {
  authMutationKeys,
  authQueryKeys,
  getAuthErrorPresentation,
  isPasswordCompromisedError
} from "@better-auth-ui/core"
import { oneTapMutationKeys } from "@better-auth-ui/core/plugins/one-tap"
import { useAuth } from "@better-auth-ui/react"
import {
  matchMutation,
  matchQuery,
  useQueryClient
} from "@tanstack/react-query"
import type { BetterFetchError } from "better-auth/react"
import { useEffect } from "react"
import { toast } from "sonner"

import { getFriendlyAuthErrorMessage } from "@/lib/auth/auth-error-message"

export function ErrorToaster() {
  const queryClient = useQueryClient()
  const { localization } = useAuth()

  useEffect(() => {
    const messageFor = (
      err: BetterFetchError,
      key?: readonly unknown[]
    ) => getFriendlyAuthErrorMessage(err, localization, key)

    const queryCache = queryClient.getQueryCache()
    const previousQueryOnError = queryCache.config.onError

    queryCache.config.onError = (error, query) => {
      previousQueryOnError?.(error, query)

      if (!matchQuery({ queryKey: authQueryKeys.all }, query)) return
      if (getAuthErrorPresentation(query.meta) !== "toast") return

      const err = error as BetterFetchError
      if (err?.error?.code === "EMAIL_NOT_VERIFIED") return
      if (!err?.error) return
      const message = messageFor(err, query.queryKey)
      if (message) toast.error(message)
    }

    const mutationCache = queryClient.getMutationCache()
    const previousMutationOnError = mutationCache.config.onError

    mutationCache.config.onError = (
      error,
      variables,
      onMutateResult,
      mutation,
      context
    ) => {
      previousMutationOnError?.(
        error,
        variables,
        onMutateResult,
        mutation,
        context
      )

      if (!matchMutation({ mutationKey: authMutationKeys.all }, mutation)) {
        return
      }
      if (getAuthErrorPresentation(mutation.meta) !== "toast") return
      // Every form that sets a new password renders this one against the
      // password field, so a toast would just repeat it.
      if (isPasswordCompromisedError(error)) return

      const err = error as BetterFetchError
      if (
        err.error?.code === "EMAIL_NOT_VERIFIED" &&
        !matchMutation({ mutationKey: oneTapMutationKeys.prompt }, mutation)
      ) {
        return
      }
      const message = messageFor(err, mutation.options.mutationKey)
      if (message) toast.error(message)
    }

    return () => {
      queryCache.config.onError = previousQueryOnError
      mutationCache.config.onError = previousMutationOnError
    }
  }, [queryClient, localization])

  return null
}
