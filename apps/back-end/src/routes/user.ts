import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from "@hapi/hapi";
import {
  getUserById,
  createUserFeedback,
  getAskForFeedback,
  trackUserEvent,
} from "../queries/query";
import { User } from "../queries/database";
import { LoggedInRequest } from "./request_types";
import { Event } from "../instrument";
import Joi from "joi";
import {
  UpdateAnalyticsConsentRequest,
  UpdateUserGuidePromptSeenRequest,
} from "./user.types";
import { computeAnalyticsConsent } from "../userAnalyticsConsent";

/**
 * Return the details of authenticated user
 */
async function getAuthUserDetails(
  request: LoggedInRequest,
  h: ResponseToolkit,
  d: any,
): Promise<ResponseObject> {
  let user: typeof User;

  user = await getUserById(request.auth.credentials.user_id);

  if (!user) {
    return h.response("please re-authenticate").code(401);
  }

  const initials =
    (user.first_name || "?")[0].toUpperCase() +
    (user.last_name || "?")[0].toUpperCase();

  return h.response({
    id: user.id ?? "",
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    initials,
    marketing: user.marketing ? 1 : 0,
    organisation: user.organisation ?? "",
    organisationNumber: user.organisation_number ?? "",
    organisationType: user.organisation_type ?? "",
    accountType: user.account_type, // #157
    organisationActivity: user.organisation_activity ?? "",
    address1: user.address1 ?? "",
    address2: user.address2 ?? "",
    city: user.city ?? "",
    postcode: user.postcode ?? "",
    phone: user.phone ?? "",
    council_id: user.council_id ?? 0,
    is_super_user: user.is_super_user ?? 0,
    analyticsConsent: computeAnalyticsConsent(user),
    userGuidePromptSeen: user.user_guide_prompt_seen ?? false,
  });
}

type UserFeedbackRequest = LoggedInRequest & {
  payload: {
    question_use_case: string;
    question_impact: string;
    question_who_benefits: string;
    question_improvements: string;
  };
};

async function userFeedback(
  request: UserFeedbackRequest,
  h: ResponseToolkit,
  d: any,
): Promise<ResponseObject> {
  const {
    question_use_case,
    question_impact,
    question_who_benefits,
    question_improvements,
  } = request.payload;

  const userFeedback = await createUserFeedback(
    question_use_case,
    question_impact,
    question_who_benefits,
    question_improvements,
    request.auth.credentials.user_id,
  );

  const userId = request.auth.credentials.user_id;

  await User.update({ ask_for_feedback: false }, { where: { id: userId } });

  // we intentionally don't pass the sessionId for this event so that the user feedback can't be used to determine the user that links to a sessionId
  trackUserEvent("0", userId, Event.USER.FEEDBACK, {
    question_use_case,
    question_impact,
    question_who_benefits,
    question_improvements,
  });

  return h.response(userFeedback).code(200);
}

/**
 * Update the user table feedback flag
 * This is used to determine if the user should be shown a feedback popup
 */

type AskForFeedbackRequest = Request & {
  payload: {
    askForFeedback: boolean;
  };
  auth: {
    credentials: {
      user_id: number;
    };
  };
};

async function updateAskForFeedback(
  request: AskForFeedbackRequest,
  h: ResponseToolkit,
  d: any,
): Promise<ResponseObject> {
  let payload: any = request.payload;

  if (typeof payload.askForFeedback !== "boolean") {
    return h.response({ message: "Invalid askForFeedback value" }).code(400);
  }

  await User.update(
    { ask_for_feedback: payload.askForFeedback },
    {
      where: {
        id: request.auth.credentials.user_id,
      },
    },
  );

  return h.response().code(200);
}

/**
 * Check the user feedback flag
 * This is used to determine if the user should be asked for feedback
 */

type GetAskForFeedbackRequest = Request & {
  auth: {
    credentials: {
      user_id: number;
    };
  };
};

async function getUserAskForFeedback(
  request: GetAskForFeedbackRequest,
  h: ResponseToolkit,
  d: any,
): Promise<ResponseObject> {
  const userId = request.auth.credentials.user_id;
  const askForFeedback = await getAskForFeedback(userId);

  return h.response({ askForFeedback }).code(200);
}

async function updateAnalyticsConsent(
  request: UpdateAnalyticsConsentRequest,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  await User.update(
    request.payload.analyticsConsent
      ? { analytics_consent_granted_at: new Date() }
      : { analytics_consent_revoked_at: new Date() },
    { where: { id: request.auth.credentials.user_id } },
  );

  return h.response().code(200);
}

async function updateUserGuidePromptSeen(
  request: UpdateUserGuidePromptSeenRequest,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const userId = request.auth.credentials.user_id;
  const { "x-session-id": sessionId } = request.headers;

  //send analytics if user viewed the user guide, so we can understand how many users are viewing the guide when prompted, and from which source they are coming to the guide
  if (request.payload.viewedUserGuide) {
    trackUserEvent(sessionId, userId, Event.USER.USER_GUIDE_VIEWED, {
      source: request.payload.viewedSource ?? "",
    });
  }

  await User.update(
    { user_guide_prompt_seen: request.payload.userGuidePromptSeen },
    {
      where: {
        id: userId,
      },
    },
  );

  return h.response().code(200);
}

export const userRoutes: ServerRoute[] = [
  /** Public APIs */ 
  /** Authenticated users only */
  // Return logged in user's details
  { method: "GET", path: "/api/user/details", handler: getAuthUserDetails },
  // Return whether the user should be asked for feedback
  {
    method: "GET",
    path: "/api/user/ask-for-feedback",
    handler: getUserAskForFeedback,
  },
  // Allow user to update their ask for feedback flag
  {
    method: "POST",
    path: "/api/user/ask-for-feedback",
    handler: updateAskForFeedback,
  },
  // Allow logged in user to submit feedback
  { method: "POST", path: "/api/user/feedback", handler: userFeedback },
  // Update analytics consent
  {
    method: "POST",
    path: "/api/user/analytics-consent",
    handler: updateAnalyticsConsent,
    options: {
      validate: {
        payload: Joi.object({
          analyticsConsent: Joi.boolean().required(),
        }),
        failAction: (request, h, err) =>
          h
            .response({ message: (err as Error).message })
            .code(400)
            .takeover(),
      },
    },
  },
  // update user_guide_prompt_seen flag
  {
    method: "POST",
    path: "/api/user/user-guide-prompt-seen",
    handler: updateUserGuidePromptSeen,
    options: {
      validate: {
        payload: Joi.object({
          userGuidePromptSeen: Joi.boolean().required(),
          viewedUserGuide: Joi.boolean().required(),
          viewedSource: Joi.string().allow("").optional(),
        }),
        failAction: (request, h, err) =>
          h
            .response({ message: (err as Error).message })
            .code(400)
            .takeover(),
      },
    },
  },
];
