import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

const buildRequest = (
  query: Record<string, string | number | undefined> = {},
) => ({
  query: {
    proprietorName: "Alice",
    year: 2019,
    secret: process.env.SECRET,
    ...query,
  },
});

const buildH = () => {
  const responses: { payload: any; statusCode: number }[] = [];
  const h = {
    response: (payload?: any) => {
      const res = {
        payload,
        statusCode: 200,
        code(statusCode: number) {
          this.statusCode = statusCode;
          return this;
        },
      };
      responses.push(res);
      return res;
    },
    responses,
  };
  return h;
};

describe("GET /proprietors/ownerships", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("authentication", () => {
    it("returns 403 when secret is missing", async () => {
      // Arrange
      const getOwnershipRecordsByProprietorStub = sandbox.stub().resolves({});
      const { getProprietorOwnerships } = await esmock("./ownerships.js", {
        "../../services/ownership/ownership-service.js": {
          getOwnershipRecordsByProprietor: getOwnershipRecordsByProprietorStub,
        },
      });

      const request = buildRequest({ secret: undefined });
      const h = buildH();

      // Act
      const result = await getProprietorOwnerships(request as any, h as any);

      // Assert
      expect(result.statusCode).to.equal(403);
      expect(getOwnershipRecordsByProprietorStub.called).to.be.false;
    });

    it("returns 403 when secret is incorrect", async () => {
      // Arrange
      const getOwnershipRecordsByProprietorStub = sandbox.stub().resolves({});
      const { getProprietorOwnerships } = await esmock("./ownerships.js", {
        "../../services/ownership/ownership-service.js": {
          getOwnershipRecordsByProprietor: getOwnershipRecordsByProprietorStub,
        },
      });

      const request = buildRequest({ secret: "wrongsecret" });
      const h = buildH();

      // Act
      const result = await getProprietorOwnerships(request as any, h as any);

      // Assert
      expect(result.statusCode).to.equal(403);
    });
  });

  describe("successful response", () => {
    it("returns 200 with whatever the service resolves, unchanged", async () => {
      // Arrange
      const serviceResult = {
        proprietorName: "Alice",
        companyRegNumber: "",
        year: 2019,
        ownerships: [
          {
            titleNumber: "T1",
            address: "1 Main St",
            polygons: [{ polyId: 1, geom: { type: "Polygon" } }],
          },
        ],
        totalResults: 1,
      };
      const getOwnershipRecordsByProprietorStub = sandbox
        .stub()
        .resolves(serviceResult);
      const { getProprietorOwnerships } = await esmock("./ownerships.js", {
        "../../services/ownership/ownership-service.js": {
          getOwnershipRecordsByProprietor: getOwnershipRecordsByProprietorStub,
        },
      });

      const request = buildRequest({ proprietorName: "Alice", year: 2019 });
      const h = buildH();

      // Act
      const result = await getProprietorOwnerships(request as any, h as any);

      // Assert
      expect(result.statusCode).to.equal(200);
      expect(result.payload).to.deep.equal(serviceResult);
    });

    it("passes year, proprietorName and companyRegistrationNo through to the service", async () => {
      // Arrange
      const getOwnershipRecordsByProprietorStub = sandbox.stub().resolves({});
      const { getProprietorOwnerships } = await esmock("./ownerships.js", {
        "../../services/ownership/ownership-service.js": {
          getOwnershipRecordsByProprietor: getOwnershipRecordsByProprietorStub,
        },
      });

      const request = buildRequest({
        proprietorName: "Alice",
        companyRegistrationNo: "12345678",
        year: 2020,
      });
      const h = buildH();

      // Act
      await getProprietorOwnerships(request as any, h as any);

      // Assert
      expect(
        getOwnershipRecordsByProprietorStub.calledWith(
          2020,
          "Alice",
          "12345678",
        ),
      ).to.be.true;
    });
  });

  describe("error handling", () => {
    it("returns 500 when the service throws", async () => {
      // Arrange
      const getOwnershipRecordsByProprietorStub = sandbox
        .stub()
        .rejects(new Error("DB unavailable"));
      const { getProprietorOwnerships } = await esmock("./ownerships.js", {
        "../../services/ownership/ownership-service.js": {
          getOwnershipRecordsByProprietor: getOwnershipRecordsByProprietorStub,
        },
      });

      const request = buildRequest();
      const h = buildH();

      // Act
      const result = await getProprietorOwnerships(request as any, h as any);

      // Assert
      expect(result.statusCode).to.equal(500);
      expect(result.payload).to.equal("Internal server error");
    });
  });

  describe("validation", () => {
    let querySchema: (typeof import("./ownerships.js"))["querySchema"];

    beforeEach(async () => {
      ({ querySchema } = await esmock("./ownerships.js"));
    });

    it("rejects a request with neither proprietorName nor companyRegistrationNo", () => {
      const { error } = querySchema.validate({
        year: 2019,
        secret: "secret-key",
      });
      expect(error).to.exist;
    });

    it("accepts a request with only proprietorName", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        year: 2019,
        secret: "secret-key",
      });
      expect(error).to.not.exist;
    });

    it("accepts a request with only companyRegistrationNo", () => {
      const { error } = querySchema.validate({
        companyRegistrationNo: "12345678",
        year: 2019,
        secret: "secret-key",
      });
      expect(error).to.not.exist;
    });

    it("accepts a request with both proprietorName and companyRegistrationNo", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        companyRegistrationNo: "12345678",
        year: 2019,
        secret: "secret-key",
      });
      expect(error).to.not.exist;
    });

    it("rejects a non-integer year", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        year: "not-a-year",
        secret: "secret-key",
      });
      expect(error).to.exist;
    });

    it("rejects a year before data exists", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        year: 1899,
        secret: "secret-key",
      });
      expect(error).to.exist;
    });

    it("rejects a year in the future", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        year: new Date().getFullYear() + 1,
        secret: "secret-key",
      });
      expect(error).to.exist;
    });

    it("accepts a well-formed year", () => {
      const { error } = querySchema.validate({
        proprietorName: "Alice",
        year: 2019,
        secret: "secret-key",
      });
      expect(error).to.not.exist;
    });
  });
});
