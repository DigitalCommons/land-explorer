import { Lifecycle, ServerRoute } from "@hapi/hapi";
import {
  updateUserOrganisationAddress,
  updateUserOrganisationDetails,
} from "../services/userOrganisation";
import Joi from "joi";

/** A text field that must be present but may be empty, with a friendly max length message */
const textField = (label: string, max: number) =>
  Joi.string()
    .allow("")
    .max(max)
    .required()
    .messages({
      "string.max": `The ${label} field cannot be longer than ${max} characters.`,
    });

const failAction: Lifecycle.Method = (request, h, err) =>
  h
    .response({ message: (err as Error).message })
    .code(400)
    .takeover();

export const userOrgRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/userOrganisation/details",
    handler: updateUserOrganisationDetails,
    options: {
      validate: {
        payload: Joi.object({
          organisation: textField("organisation name", 100),
          organisationNumber: textField("organisation number", 100),
          organisationType: textField("organisation type", 100),
          organisationActivity: textField("organisation activity", 100),
        }).required(),
        failAction,
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
          address1: textField("organisation address line 1", 100),
          address2: textField("organisation address line 2", 100),
          city: textField("organisation city", 100),
          postcode: textField("organisation postcode", 10),
        }).required(),
        failAction,
      },
    },
  },
];
