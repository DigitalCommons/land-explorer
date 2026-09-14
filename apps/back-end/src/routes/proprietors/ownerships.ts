import { ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import { LoggedInRequest } from "../request_types";
import { getProprietorOwnerships } from "../../clients/pbs/proprietor-ownerships";
import { trackUserEvent } from "../../queries/query";
import { Event } from "../../instrument";

const MINIMUM_OWNERSHIPS_YEAR: number = 2017;

type GetProprietorOwnershipsRequest = LoggedInRequest & {
  query: {
    proprietorName?: string;
    companyRegNo?: string;
    year: number;
  };
};

/**
 * Handler for GET /api/proprietors/ownerships. Proxies the request to the Property Boundaries
 * Service and returns the response. Forwards client aborts to the PBS request so that in-flight
 * requests are not left running unnecessarily.
 * @param request - The incoming request, which includes query parameters for proprietorName
 * and/or companyRegNo, and year.
 * @param h - The Hapi response toolkit for constructing responses.
 * @returns A response object containing the proprietor's ownerships for that year, or an error
 * message.
 */
export async function getOwnerships(
  request: GetProprietorOwnershipsRequest,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { proprietorName, companyRegNo, year } = request.query;
  const { user_id } = request.auth.credentials;
  const { "x-session-id": sessionId } = request.headers;

  const abortController = new AbortController();
  const onClose = () => abortController.abort();
  request.raw.req.on("close", onClose);

  try {
    // Forward client abort to PBS so in-flight requests are not left running
    const result = await getProprietorOwnerships(
      year,
      proprietorName,
      companyRegNo,
      abortController.signal,
    );

    trackUserEvent(sessionId, user_id, Event.LAND_OWNERSHIP.HISTORIC_SEARCH);

    return h.response(result).code(200);
  } catch (error) {
    if (abortController.signal.aborted) {
      return h.response().code(499);
    }
    console.error("Error in getOwnerships:", error);
    return h.response("Internal server error").code(500);
  } finally {
    request.raw.req.off("close", onClose);
  }
}

export const proprietorOwnershipsRoute: ServerRoute = {
  method: "GET",
  path: "/api/proprietors/ownerships",
  handler: getOwnerships,
  options: {
    validate: {
      query: Joi.object({
        proprietorName: Joi.string().trim().min(1).max(400).optional(),
        companyRegNo: Joi.string().trim().min(1).max(50).optional(),
        year: Joi.number()
          .integer()
          .min(MINIMUM_OWNERSHIPS_YEAR)
          .custom((value, helpers) => {
            // Computed per-validation (not baked into the schema at import time) so the bound
            // stays correct across a New Year's Eve without requiring a server restart.
            const maxYear = new Date().getFullYear() - 1;
            return value > maxYear
              ? helpers.error("number.max", { limit: maxYear })
              : value;
          })
          .required(),
      }).or("proprietorName", "companyRegNo"),
      failAction: (request, h, err) =>
        h
          .response({ message: (err as Error).message })
          .code(400)
          .takeover(),
    },
  },
};
