import { expect } from "chai";
import { assert, createSandbox, fake } from "sinon";
import { Server } from "@hapi/hapi";
import { init } from "../server";

// Dependencies to be stubbed
const Model = require("../queries/database");

const sandbox = createSandbox();

describe("POST /api/userOrganisation/details", () => {
  let server: Server;
  let userUpdate: ReturnType<typeof fake>;

  const orgDetails = {
    organisation: "Yummy fruits",
    organisationNumber: "12345678",
    organisationType: "commercial",
    organisationActivity: "Growing fruit",
    address1: "1 Fruit Bowl",
    address2: "Orchard Lane",
    city: "Fruitville",
    postcode: "FR1 1UT",
  };

  const updateOrgDetailsRequest = (payload: unknown) => ({
    method: "POST",
    url: "/api/userOrganisation/details",
    payload: payload as object,
    auth: {
      strategy: "simple",
      credentials: {
        user_id: 123,
      },
    },
  });

  beforeEach(async () => {
    server = await init();
    userUpdate = fake.resolves([1]);
    sandbox.replace(Model.User, "update", userUpdate);
  });

  afterEach(async () => {
    await server.stop();
    sandbox.restore();
  });

  context("Valid details", () => {
    it("returns status 200", async () => {
      const res = await server.inject(updateOrgDetailsRequest(orgDetails));
      expect(res.statusCode).to.equal(200);
    });

    it("updates the organisation details on the logged in user", async () => {
      await server.inject(updateOrgDetailsRequest(orgDetails));

      assert.calledOnceWithExactly(
        userUpdate,
        {
          organisation: "Yummy fruits",
          organisation_number: "12345678",
          organisation_type: "commercial",
          organisation_activity: "Growing fruit",
          address1: "1 Fruit Bowl",
          address2: "Orchard Lane",
          city: "Fruitville",
          postcode: "FR1 1UT",
        },
        { where: { id: 123 } },
      );
    });

    it("allows empty fields", async () => {
      const emptyDetails = Object.fromEntries(
        Object.keys(orgDetails).map((key) => [key, ""]),
      );
      const res = await server.inject(updateOrgDetailsRequest(emptyDetails));

      expect(res.statusCode).to.equal(200);
      assert.calledOnce(userUpdate);
    });
  });

  context("Invalid details", () => {
    it("rejects a missing field", async () => {
      const { city, ...withoutCity } = orgDetails;
      const res = await server.inject(updateOrgDetailsRequest(withoutCity));

      expect(res.statusCode).to.equal(400);
      expect(res.result).to.eql({ message: '"city" is required' });
      assert.notCalled(userUpdate);
    });

    it("rejects a field that's too long, with a friendly message", async () => {
      const res = await server.inject(
        updateOrgDetailsRequest({ ...orgDetails, organisation: "a".repeat(101) }),
      );

      expect(res.statusCode).to.equal(400);
      expect(res.result).to.eql({
        message: "The organisation name field cannot be longer than 100 characters.",
      });
      assert.notCalled(userUpdate);
    });

    it("rejects a postcode longer than 10 characters", async () => {
      const res = await server.inject(
        updateOrgDetailsRequest({ ...orgDetails, postcode: "12345678901" }),
      );

      expect(res.statusCode).to.equal(400);
      expect(res.result).to.eql({
        message: "The organisation postcode field cannot be longer than 10 characters.",
      });
      assert.notCalled(userUpdate);
    });

    it("rejects unknown fields", async () => {
      const res = await server.inject(
        updateOrgDetailsRequest({ ...orgDetails, is_super_user: 1 }),
      );

      expect(res.statusCode).to.equal(400);
      assert.notCalled(userUpdate);
    });

    it("rejects a missing payload", async () => {
      const res = await server.inject(updateOrgDetailsRequest(undefined));

      expect(res.statusCode).to.equal(400);
      assert.notCalled(userUpdate);
    });
  });

  context("Not logged in", () => {
    it("returns status 401", async () => {
      const res = await server.inject({
        method: "POST",
        url: "/api/userOrganisation/details",
        payload: orgDetails,
      });

      expect(res.statusCode).to.equal(401);
      assert.notCalled(userUpdate);
    });
  });
});
