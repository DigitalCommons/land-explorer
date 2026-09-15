"use strict";
// Import this first!
import "./instrument";

// Now import other modules
import * as Sentry from "@sentry/node";
import Hapi from "@hapi/hapi";
import { Request, Server } from "@hapi/hapi";
import { userAuthRoutes, userRoutes } from "./routes/user";
import { mapRoutes } from "./routes/map";
import { dataGroupRoutes } from "./routes/datagroup";
import { proprietorRoutes } from "./routes/proprietors";
import { setupWebsockets } from "./websockets/server";
import { getCorsOrigins } from "./cors";
import { isBetterAuthEnabled } from "./featureFlagUtils";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import * as Boom from "@hapi/boom";

const AuthBearer = require("hapi-auth-bearer-token");
const Inert = require("@hapi/inert");
const jwt = require("jsonwebtoken");

export let server: Server;

function index(request: Request): string {
  console.log("Processing request", request.info.id);
  return "Hello! Nice to have met you...";
}

export const init = async function (): Promise<Server> {
  const corsOrigins = getCorsOrigins();

  server = Hapi.server({
    port: process.env.PORT || 4000,
    host: "0.0.0.0",
    debug: { log: ["error"], request: ["error"] },
    // Allow cross-origin requests from the front-end origin(s). In local dev the
    // front-end is at localhost:8080; in deployed environments (e.g. Coolify) the
    // front-end is served from its own domain, so set CORS_ORIGINS to a
    // comma-separated list of allowed origins, e.g.
    //   CORS_ORIGINS=https://dev.cool.landexplorer.coop
    routes: {
      cors: corsOrigins.length > 0 && {
        origin: corsOrigins,
        // Allow the headers the front-end actually sends
        // x-session-id is added to every request as otherwise CORS preflight
        // fails for authenticated calls
        additionalHeaders: ["authorization", "content-type", "x-session-id"],
      },
    },
  });

  await server.register(AuthBearer);
  await server.register(Inert);

  if (!isBetterAuthEnabled()) {
    server.auth.strategy("simple", "bearer-access-token", {
      allowQueryToken: true, // optional, false by default
      validate: async (request: any, token: string, h: any) => {
        let isValid = false;
        let credentials = {};

        try {
          // see the loginUser function to see token content
          const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);

          isValid = true;
          credentials = { user_id: decodedToken.user_id };
        } catch (err) {
          console.log("Failed authentication", err);
        }

        return { isValid, credentials };
      },
    });

    server.auth.default("simple");
  } else {
    server.auth.scheme("betterauth", () => {
      return {
        authenticate: async (request, h) => {
          const headers: Headers = new Headers(request.headers as Record<string, string>);
          const session = await auth.api.getSession({headers:headers});
          if (!session) {
            throw Boom.unauthorized(null, 'betterauth');
          } else {                                    
            return h.authenticated({ credentials: { user_id: session.user.appUserId } });
          }
        }
    }});

    server.auth.strategy("session", "betterauth");   
    server.auth.default("session");
  
    server.route({
      method: "*",
      path: "/api/auth/{path*}",
      options: {
        auth: false,
        // Hand the raw, unconsumed request stream to better-auth's own node
        // handler, which parses the body itself - if Hapi parses/buffers the
        // payload first (the default), better-auth sees an empty stream.
        payload: { parse: false, output: "stream" },
      },
      handler: async (request, h) => {      
        await toNodeHandler(auth)(request.raw.req, request.raw.res);
        return h.abandon;
      },
    });
 
    server.route({
      method: "*",
      path: "/api/auth/{path*}",
      options: {
        auth: false,
        // Hand the raw, unconsumed request stream to better-auth's own node
        // handler, which parses the body itself - if Hapi parses/buffers the
        // payload first (the default), better-auth sees an empty stream.
        payload: { parse: false, output: "stream" },
      },
      handler: async (request, h) => {      
        await toNodeHandler(auth)(request.raw.req, request.raw.res);
        return h.abandon;
      },
    });
  }
  
  server.route({
    method: "GET",
    path: "/",
    handler: index,
    options: {
      auth: false,
    },
  });

  server.route(userRoutes);
  server.route(userAuthRoutes())
  server.route(mapRoutes);
  server.route(dataGroupRoutes);
  server.route(proprietorRoutes);

  // Log requests and response codes
  server.events.on("response", (request: any) => {
    console.log(
      request.info.remoteAddress +
        ": " +
        request.method.toUpperCase() +
        " " +
        request.path +
        " --> " +
        request.response.statusCode,
    );
  });

  setupWebsockets(server);

  // Add global error handler for unhandled errors
  server.events.on("request", (request, event, tags) => {
    if (tags.error) {
      console.error("Request error:", event.error);
    }
  });

  await Sentry.setupHapiErrorHandler(server);

  return server;
};

export const start = async function (): Promise<void> {
  console.log(`Listening on ${server.settings.host}:${server.settings.port}`);
  return server.start();
};

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection");
  console.error(err);
  process.exit(1);
});
