import { ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { LoggedInRequest } from "../routes/request_types";
import { User } from "../queries/database";

export type UpdateOrgDetailsRequest = LoggedInRequest & {
  payload: {
    organisation: string;
    organisationNumber: string;
    organisationType: string;
    organisationActivity: string;  
  }
};

export type UpdateOrgAddressRequest = LoggedInRequest & {
  payload: {
    address1: string;
    address2: string;
    city: string;
    postcode: string;  
  }
};

export async function updateUserOrganisationDetails(request: UpdateOrgDetailsRequest,
  h: ResponseToolkit): Promise<ResponseObject>  {
  
   await User.update(
    {
      organisation: request.payload.organisation,
      organisation_number: request.payload.organisationNumber,
      organisation_type: request.payload.organisationType,
      organisation_activity: request.payload.organisationActivity,
    },
    {
      where: {
        id: request.auth.credentials.user_id,
      },
    });

  return h.response().code(200);
}

export async function updateUserOrganisationAddress(request: UpdateOrgAddressRequest,
  h: ResponseToolkit): Promise<ResponseObject>  {    

  await User.update(
    {
      address1: request.payload.address1,
      address2: request.payload.address2,
      city: request.payload.city,
      postcode: request.payload.postcode
    },
    {
      where: {
        id: request.auth.credentials.user_id,
      },
    });

  return h.response().code(200);
  }
