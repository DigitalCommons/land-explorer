import {
  ServerRoute,
  Request,
  ResponseObject,
  ResponseToolkit,
} from "@hapi/hapi";
import Joi from "joi";
import { logger } from "../../pipeline/logger.js";
import { getProprietorOwnershipRecords } from "../../services/proprietor-ownership.js";

const MINUMUM_YEAR = 2017;

type GetProprietorOwnershipsRequest = Request & {
  query: {
    proprietorName?: string;
    companyRegistrationNo?: string;
    year: number;
    secret: string;
  };
};

/**
 * Returns the properties a proprietor held on 31 December of the given year, based on the
 * land_ownership_snapshots table. When companyRegistrationNo is given it's used on its own to
 * match, since it's the stable unique key for a company; otherwise proprietorName is matched.
 *
 * Not paginated: the frontend needs every one of the proprietor's properties at once, both to
 * list them and to highlight all of them on the map together.
 * @param request The incoming request, containing `proprietorName` and/or `companyRegistrationNo`,
 * `year` and api secret query params
 * @param h The Hapi response toolkit
 * @returns The proprietor's ownerships for that year, each with the polygon(s) for its title, or
 * an error response
 */
export const getProprietorOwnerships = async (
  request: GetProprietorOwnershipsRequest,
  h: ResponseToolkit,
): Promise<ResponseObject> => {
  const { proprietorName, companyRegistrationNo, year, secret } = request.query;

  if (!secret || secret !== process.env.SECRET) {
    return h.response("missing or incorrect secret").code(403);
  }

  try {
    const records = await getProprietorOwnershipRecords(
      year,
      proprietorName,
      companyRegistrationNo,
    );

    return h.response(records).code(200);
  } catch (error) {
    logger.error(error, "Error fetching proprietor ownerships");
    return h.response("Internal server error").code(500);
  }
};

export const querySchema = Joi.object({
  proprietorName: Joi.string().trim().min(1).max(255).optional(),
  companyRegistrationNo: Joi.string().trim().min(1).max(255).optional(),
  year: Joi.number()
    .integer()
    .min(MINUMUM_YEAR)
    .max(new Date().getFullYear() - 1)
    .required(),
  secret: Joi.string().required(),
}).or("proprietorName", "companyRegistrationNo");

export const proprietorOwnershipsRoute: ServerRoute = {
  method: "GET",
  path: "/proprietors/ownerships",
  handler: getProprietorOwnerships,
  options: {
    auth: false,
    validate: {
      query: querySchema,
      failAction: (request, h, err) =>
        h
          .response({ message: (err as Error).message })
          .code(400)
          .takeover(),
    },
  },
};
