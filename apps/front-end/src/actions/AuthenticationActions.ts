import { optOutAndResetAnalyticsUser } from "@/analytics";

// TODO: Remove this  as part of the clean up of VITE_FEATURE_USE_BETTERAUTH feature flag - 
// ensure we are still opting out of analytics 

export const logOut = () => {
  return async (dispatch: any) => {
    optOutAndResetAnalyticsUser();
    dispatch({ type: "LOG_OUT" });
  };
};

export const sessionTimedOut = () => {
  return async (dispatch: any) => {
    optOutAndResetAnalyticsUser();
    dispatch({ type: "SESSION_TIMED_OUT" });
  };
};
