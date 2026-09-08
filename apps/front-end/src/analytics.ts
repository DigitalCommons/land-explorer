import mixpanel from "mixpanel-browser";
import constants from "@/constants";
import { AnalyticsEvent } from "./types/analytics-events";

const analyticsEnabled = !!constants.MIXPANEL_TOKEN;

export const initializeMixpanel = (): void => {
  if (!constants.MIXPANEL_TOKEN) {
    return;
  }

  mixpanel.init(constants.MIXPANEL_TOKEN, {
    debug: constants.DEV_MODE || false,
    persistence: "localStorage",
    ip: false,
    opt_out_tracking_by_default: true,
  });
};

/** Set (anonymized) user in the Mixpanel event data */
export const optInAndSetAnalyticsUser = async (
  analyticsUserHash: string,
) => {
  if (!analyticsEnabled) {
    return;
  }

  mixpanel.identify(analyticsUserHash);
  if (!mixpanel.has_opted_in_tracking()) {
    mixpanel.opt_in_tracking();
  }
};

/** Reset the user in the Mixpanel event data e.g. when user logs out */
export const optOutAndResetAnalyticsUser = () => {
  if (!analyticsEnabled) {
    return;
  }
  mixpanel.opt_out_tracking();
  mixpanel.reset();
};


export const trackEvent = <T extends Record<string, unknown>>(
  action: AnalyticsEvent,
  data: T,
  consent: boolean,
) => {
  if (!analyticsEnabled || !consent) {
    return;
  }

  mixpanel.track(action, data);
};
