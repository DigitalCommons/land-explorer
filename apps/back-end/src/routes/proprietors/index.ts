import { ServerRoute } from "@hapi/hapi";
import { proprietorsRoute } from "./proprietors";
import { proprietorOwnershipsRoute } from "./ownerships";

export const proprietorRoutes: ServerRoute[] = [
  proprietorsRoute,
  proprietorOwnershipsRoute,
];
