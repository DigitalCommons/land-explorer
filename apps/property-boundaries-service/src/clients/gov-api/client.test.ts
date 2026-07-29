import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("gov-api client", () => {
  let sandbox: sinon.SinonSandbox;
  let getStub: sinon.SinonStub;
  let getFullUKDataset: (typeof import("./client.js"))["getFullUKDataset"];
  let getFullOverseasDataset: (typeof import("./client.js"))["getFullOverseasDataset"];

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    getStub = sandbox.stub();

    ({ getFullUKDataset, getFullOverseasDataset } = await esmock("./client.js", {
      axios: {
        default: { create: sandbox.stub().returns({ get: getStub }) },
      },
    }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getFullUKDataset", () => {
    it("requests the padded CCOD FULL filename for the given month and year", async () => {
      // Arrange
      getStub.resolves({ data: { result: { download_url: "uk-url" } } });

      // Act
      await getFullUKDataset(1, 2020);

      // Assert
      expect(
        getStub.calledWith("/datasets/history/ccod/CCOD_FULL_2020_01.zip"),
      ).to.be.true;
    });

    it("returns the download url on success", async () => {
      // Arrange
      getStub.resolves({ data: { result: { download_url: "uk-url" } } });

      // Act
      const result = await getFullUKDataset(6, 2021);

      // Assert
      expect(result).to.deep.equal({ downloadUrl: "uk-url" });
    });

    it("propagates the error when the request fails", async () => {
      // Arrange
      const error = new Error("network error");
      getStub.rejects(error);

      // Act & Assert
      try {
        await getFullUKDataset(6, 2021);
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe("getFullOverseasDataset", () => {
    it("requests the padded OCOD FULL filename for the given month and year", async () => {
      // Arrange
      getStub.resolves({ data: { result: { download_url: "overseas-url" } } });

      // Act
      await getFullOverseasDataset(1, 2020);

      // Assert
      expect(
        getStub.calledWith("/datasets/history/ocod/OCOD_FULL_2020_01.zip"),
      ).to.be.true;
    });

    it("returns the download url on success", async () => {
      // Arrange
      getStub.resolves({ data: { result: { download_url: "overseas-url" } } });

      // Act
      const result = await getFullOverseasDataset(6, 2021);

      // Assert
      expect(result).to.deep.equal({ downloadUrl: "overseas-url" });
    });

    it("propagates the error when the request fails", async () => {
      // Arrange
      const error = new Error("network error");
      getStub.rejects(error);

      // Act & Assert
      try {
        await getFullOverseasDataset(6, 2021);
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
