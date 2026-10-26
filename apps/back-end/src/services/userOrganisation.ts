import { ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { LoggedInRequest } from "../routes/request_types";
import { User } from "../queries/database";

export type UpdateOrgDetailsModel = {
  organisation: string;
  organisationNumber: string;
  organisationType: string;
  organisationActivity: string;  
};

export async function updateUserOrganisationDetails(request: LoggedInRequest,
  h: ResponseToolkit): Promise<ResponseObject>  {
  
  let payload: any = request.payload;

  await User.update(
    {
      organisation: payload.organisation,
      organisation_number: payload.organisationNumber,
      organisation_type: payload.organisationType,
      organisation_activity: payload.organisationActivity,
    },
    {
      where: {
        id: request.auth.credentials.user_id,
      },
    });

  return h.response().code(200);
}
