import {
  getAuthErrorCode,
  getAuthErrorMessage,
  type Localization
} from "@better-auth-ui/core"
import type { BetterFetchError } from "better-auth/react"

// Better Auth UI gives both of these one combined "invalid or has expired"
// message, which leaves the user guessing whether to retype or resend
const OTP_ERROR_MESSAGES: Partial<Record<string, string>> = {
  OTP_EXPIRED: "This code has expired. Request a new code.",
  INVALID_OTP:
    "This code is incorrect. Check it and try again, or request a new code."
}

/**
 * The message to show the user for a failed auth request.
 *
 * Server failures carry no useful message (a raw 500 has an empty body), so
 * they get Better Auth UI's friendly copy. 4xx messages come from our
 * validation and are written for the user, so they're shown as they are -
 * unless Better Auth UI has its own copy for the error, which reads better
 * than Better Auth's terse messages (e.g. "Invalid OTP").
 */
export function getFriendlyAuthErrorMessage(
  err: BetterFetchError,
  localization: Localization,
  key?: readonly unknown[]
) {
  const otpMessage = OTP_ERROR_MESSAGES[getAuthErrorCode(err) ?? ""]
  if (otpMessage) return otpMessage

  const friendly = getAuthErrorMessage(err, localization, key)
  if (err.error?.status >= 500 || !err.error?.message) return friendly
  return friendly && friendly !== localization.errors.generic
    ? friendly
    : err.error.message
}
