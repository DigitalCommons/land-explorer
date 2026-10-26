import { ServerRoute } from "@hapi/hapi";
import { updateUserOrganisationAddress, updateUserOrganisationDetails } from "../services/userOrganisation";
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
  {
    method: "POST",
    path: "/api/userOrganisation/address",
    handler: updateUserOrganisationAddress,
    options: {
      validate: {
        payload: Joi.object({
          address1: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation address line 1 field cannot be longer than 100 characters.",
            }),
          address2: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation address line 2 field cannot be longer than 100 characters.",
            }),
          city: Joi.string()
            .allow("")
            .max(100)
            .messages({
              "string.max":
                "The organisation city field cannot be longer than 100 characters.",
            }),
          postcode: Joi.string()
            .allow("")
            .max(10)
            .messages({
              "string.max":
                "The organisation postcode field cannot be longer than 10 characters.",
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
