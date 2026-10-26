import { ServerRoute } from "@hapi/hapi";
import { updateUserOrganisationDetails } from "../services/userOrganisation";
import Joi from "joi";

export const userOrgRoutes: ServerRoute[] = [   
  {
    method: "POST",
    path: "/api/userOrganisation/details",
    handler: updateUserOrganisationDetails,
    options: {
      validate: {
        payload: Joi.object({
          organisation: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation name field cannot be longer than 100 characters.",
            }),
          organisationNumber: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation number field cannot be longer than 100 characters.",
            }),
          organisationType: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation type field cannot be longer than 100 characters.",
            }),
          organisationActivity: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation activity field cannot be longer than 100 characters.",
            }),
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
