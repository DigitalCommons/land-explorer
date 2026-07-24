import { expect } from "chai";
import { createSandbox, fake } from "sinon";
import { Server } from "@hapi/hapi";
import { init } from "../../server";
import { ProprietorOwnershipsResponse } from "../../clients/pbs/proprietor-ownerships";

// Dependencies to be stubbed
const proprietorOwnerships = require("../../clients/pbs/proprietor-ownerships");

const sandbox = createSandbox();

describe("GET /api/proprietors/ownerships", () => {
  let server: Server;

  const validRequest = {
    method: "GET",
    url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd&year=2020",
    auth: {
      strategy: "simple",
      credentials: {
        user_id: 123,
      },
    },
  };

  const pbsResponse: ProprietorOwnershipsResponse = {
    proprietorName: "Acme Ltd",
    companyRegNumber: "12345678",
    year: 2020,
    ownerships: [
      {
        titleNumber: "AB123456",
        address: "1 Main St",
        polygons: [{ polyId: 1, geom: { type: "Polygon", coordinates: [] } }],
      },
    ],
    totalResults: 1,
  };

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
    sandbox.restore();
  });

  context("valid request", () => {
    beforeEach(() => {
      sandbox.replace(
        proprietorOwnerships,
        "getProprietorOwnerships",
        fake.resolves(pbsResponse),
      );
    });

    it("returns status 200", async () => {
      const res = await server.inject(validRequest);

      expect(res.statusCode).to.equal(200);
    });

    it("returns the PBS response", async () => {
      const res = await server.inject(validRequest);

      expect(res.result).to.deep.equal(pbsResponse);
    });
  });

  context("missing proprietorName and companyRegNo", () => {
    it("returns status 400", async () => {
      const res = await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?year=2020",
      });

      expect(res.statusCode).to.equal(400);
      expect(res.result)
        .to.have.property("message")
        .that.includes(
          "must contain at least one of [proprietorName, companyRegNo]",
        );
    });
  });

  context("companyRegNo given instead of proprietorName", () => {
    it("returns status 200", async () => {
      const stub = fake.resolves(pbsResponse);
      sandbox.replace(proprietorOwnerships, "getProprietorOwnerships", stub);

      const res = await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?companyRegNo=12345678&year=2020",
      });

      expect(res.statusCode).to.equal(200);
    });
  });

  context("missing year", () => {
    it("returns status 400", async () => {
      const res = await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd",
      });

      expect(res.statusCode).to.equal(400);
      expect(res.result)
        .to.have.property("message")
        .that.includes('"year" is required');
    });
  });

  context("non-integer year", () => {
    it("returns status 400", async () => {
      const res = await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd&year=abc",
      });

      expect(res.statusCode).to.equal(400);
      expect(res.result)
        .to.have.property("message")
        .that.includes('"year" must be a number');
    });
  });

  context("year before data exists", () => {
    it("returns status 400", async () => {
      const res = await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd&year=1899",
      });

      expect(res.statusCode).to.equal(400);
      expect(res.result)
        .to.have.property("message")
        .that.includes(
          '"year" must be greater than or equal to 2017',
        );
    });
  });

  context("year in the future", () => {
    it("returns status 400", async () => {
      const futureYear = new Date().getFullYear() + 1;
      const res = await server.inject({
        ...validRequest,
        url: `/api/proprietors/ownerships?proprietorName=Acme+Ltd&year=${futureYear}`,
      });

      expect(res.statusCode).to.equal(400);
      expect(res.result)
        .to.have.property("message")
        .that.includes("must be less than or equal to");
    });
  });

  context("no ownerships found for that proprietor/year", () => {
    it("returns status 200 with an empty result, not an error", async () => {
      const emptyResponse: ProprietorOwnershipsResponse = {
        proprietorName: null,
        companyRegNumber: null,
        year: 2020,
        ownerships: [],
        totalResults: 0,
      };
      sandbox.replace(
        proprietorOwnerships,
        "getProprietorOwnerships",
        fake.resolves(emptyResponse),
      );

      const res = await server.inject(validRequest);

      expect(res.statusCode).to.equal(200);
      expect(res.result).to.deep.equal(emptyResponse);
    });
  });

  context("arguments passed to PBS", () => {
    it("forwards year, proprietorName and companyRegNo from the request", async () => {
      const stub = fake.resolves(pbsResponse);
      sandbox.replace(proprietorOwnerships, "getProprietorOwnerships", stub);

      await server.inject({
        ...validRequest,
        url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd&companyRegNo=12345678&year=2020",
      });

      expect(stub.calledOnce).to.be.true;
      expect(stub.firstCall.args[0]).to.equal(2020);
      expect(stub.firstCall.args[1]).to.equal("Acme Ltd");
      expect(stub.firstCall.args[2]).to.equal("12345678");
    });
  });

  context("unauthenticated request", () => {
    it("returns status 401", async () => {
      const res = await server.inject({
        method: "GET",
        url: "/api/proprietors/ownerships?proprietorName=Acme+Ltd&year=2020",
      });

      expect(res.statusCode).to.equal(401);
      expect(res.result)
        .to.have.property("message")
        .that.includes("Missing authentication");
    });
  });

  context("PBS throws an error", () => {
    it("returns status 500", async () => {
      sandbox.replace(
        proprietorOwnerships,
        "getProprietorOwnerships",
        fake.rejects(new Error("PBS unavailable")),
      );
      const res = await server.inject(validRequest);

      expect(res.statusCode).to.equal(500);
    });
  });

  context("client disconnects during request", () => {
    it("returns status 499", async () => {
      let capturedRawReq: any;

      server.ext("onPreHandler", (request: any, h: any) => {
        capturedRawReq = request.raw.req;
        return h.continue;
      });

      sandbox.replace(
        proprietorOwnerships,
        "getProprietorOwnerships",
        (
          _year: number,
          _proprietorName: string | undefined,
          _companyRegNo: string | undefined,
          signal?: AbortSignal,
        ) =>
          new Promise<never>((_resolve, reject) => {
            signal?.addEventListener("abort", () => {
              reject(new Error("Request aborted"));
            });
            // Simulate the client closing the connection. setImmediate defers
            // until after the handler has attached its own "close" listener.
            setImmediate(() => capturedRawReq.emit("close"));
          }),
      );

      const res = await server.inject(validRequest);
      expect(res.statusCode).to.equal(499);
    });
  });
});
