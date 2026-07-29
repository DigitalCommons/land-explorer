import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("getOwnershipRecordsByProprietor", () => {
  let sandbox: sinon.SinonSandbox;
  let getOwnershipsForProprietorAndYearStub: sinon.SinonStub;
  let getOwnershipRecordsByProprietor: (typeof import("./ownership-service.js"))["getOwnershipRecordsByProprietor"];

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    getOwnershipsForProprietorAndYearStub = sandbox.stub().resolves([]);

    ({ getOwnershipRecordsByProprietor } = await esmock(
      "./ownership-service.js",
      {
        "../../queries/land-ownership-snapshot-query.js": {
          getOwnershipsForProprietorAndYear:
            getOwnershipsForProprietorAndYearStub,
        },
      },
    ));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("passes proprietorName, companyRegistrationNo and year through to the query", async () => {
    // Act
    await getOwnershipRecordsByProprietor(2020, "Alice", "12345678");

    // Assert
    expect(
      getOwnershipsForProprietorAndYearStub.calledWith(
        "Alice",
        "12345678",
        2020,
      ),
    ).to.be.true;
  });

  it("groups rows by title_no, collecting each title's polygons, plus name/reg no from the first row", async () => {
    // Arrange
    getOwnershipsForProprietorAndYearStub.resolves([
      {
        title_no: "T1",
        property_address: "1 Main St",
        proprietor_name: "Alice",
        company_registration_no: "",
        poly_id: 1,
        geom: { type: "Polygon", coordinates: [[1, 1]] },
      },
      {
        title_no: "T1",
        property_address: "1 Main St",
        proprietor_name: "Alice",
        company_registration_no: "",
        poly_id: 2,
        geom: { type: "Polygon", coordinates: [[2, 2]] },
      },
      {
        title_no: "T2",
        property_address: "2 Main St",
        proprietor_name: "Alice",
        company_registration_no: "",
        poly_id: 3,
        geom: { type: "Polygon", coordinates: [[3, 3]] },
      },
    ]);

    // Act
    const result = await getOwnershipRecordsByProprietor(2019, "Alice");

    // Assert
    expect(result).to.deep.equal({
      proprietorName: "Alice",
      companyRegNumber: "",
      year: 2019,
      ownerships: [
        {
          titleNumber: "T1",
          address: "1 Main St",
          polygons: [
            { polyId: 1, geom: { type: "Polygon", coordinates: [[1, 1]] } },
            { polyId: 2, geom: { type: "Polygon", coordinates: [[2, 2]] } },
          ],
        },
        {
          titleNumber: "T2",
          address: "2 Main St",
          polygons: [
            { polyId: 3, geom: { type: "Polygon", coordinates: [[3, 3]] } },
          ],
        },
      ],
      totalResults: 2,
    });
  });

  it("returns null name/reg number, an empty ownerships array and zero totalResults when nothing matches", async () => {
    // Act
    const result = await getOwnershipRecordsByProprietor(2019, "Nobody");

    // Assert
    expect(result).to.deep.equal({
      proprietorName: null,
      companyRegNumber: null,
      year: 2019,
      ownerships: [],
      totalResults: 0,
    });
  });
});
