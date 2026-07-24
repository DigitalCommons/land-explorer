import {
  ServerRoute,
  Request,
  ResponseObject,
  ResponseToolkit,
} from "@hapi/hapi";
import Joi from "joi";
import { logger } from "../../pipeline/logger.js";
import { getOwnershipsForProprietorAndYear } from "../../queries/land-ownership-snapshot-query.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const MINUMUM_YEAR = 2017;

type GetProprietorOwnershipsRequest = Request & {
  query: {
    proprietorName?: string;
    companyRegistrationNo?: string;
    year: number;
    page: number;
    pageSize: number;
    secret: string;
  };
};

/**
 * Returns the properties a proprietor held on 31 December of the given year, based on the
 * land_ownership_snapshots table. When companyRegistrationNo is given it's used on its own to
 * match, since it's the stable unique key for a company; otherwise proprietorName is matched.
 * @param request The incoming request, containing `proprietorName` and/or `companyRegistrationNo`,
 * `year`, `page`, `pageSize` and api secret query params
 * @param h The Hapi response toolkit
 * @returns A paginated response containing the proprietor's ownerships for that year, or an error
 * response
 */
export const getProprietorOwnerships = async (
  request: GetProprietorOwnershipsRequest,
  h: ResponseToolkit,
): Promise<ResponseObject> => {
  const {
    proprietorName,
    companyRegistrationNo,
    year,
    page,
    pageSize,
    secret,
  } = request.query;

  if (!secret || secret !== process.env.SECRET) {
    return h.response("missing or incorrect secret").code(403);
  }

  try {
    const { rows, totalResults } = await getOwnershipsForProprietorAndYear(
      proprietorName,
      companyRegistrationNo,
      year,
      page,
      pageSize,
    );

    return h
      .response({
        proprietorName: rows[0]?.proprietor_name ?? null,
        companyRegNumber: rows[0]?.company_registration_no ?? null,
        year,
        ownerships: rows.map((row) => ({
          titleNumber: row.title_no,
          address: row.property_address,
        })),
        page,
        pageSize,
        totalResults,
      })
      .code(200);
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
  page: Joi.number().integer().min(1).optional().default(DEFAULT_PAGE),
  pageSize: Joi.number()
    .integer()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
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
