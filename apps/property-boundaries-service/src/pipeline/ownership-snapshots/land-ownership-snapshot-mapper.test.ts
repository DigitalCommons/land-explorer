import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";
import { RawOwnership } from "../../gov-api/datasets.types.js";

describe("mapRawOwnershipsToSnapshotRows", () => {
  let sandbox: sinon.SinonSandbox;
  let loggerErrorStub: sinon.SinonStub;
  let mapRawOwnershipsToSnapshotRows: (typeof import("./land-ownership-snapshot-mapper.js"))["mapRawOwnershipsToSnapshotRows"];

  const snapshotDate = new Date(2020, 11, 31);

  const baseOwnership: RawOwnership = {
    "Title Number": "TITLE1",
    Tenure: "Freehold",
  };

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    loggerErrorStub = sandbox.stub();

    ({ mapRawOwnershipsToSnapshotRows } = await esmock(
      "./land-ownership-snapshot-mapper.js",
      {
        "../logger.js": {
          logger: { error: loggerErrorStub, info: sandbox.stub() },
        },
      },
    ));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("creates one snapshot row per populated proprietor slot", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Proprietor Name (1)": "Alice",
      "Company Registration No. (1)": "111",
      "Proprietor Name (2)": "Bob",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      false,
    );

    // Assert
    expect(rows).to.have.length(2);
    expect(rows[0]).to.include({
      title_no: "TITLE1",
      snapshot_date: snapshotDate,
      proprietor_name: "Alice",
      company_registration_no: "111",
      proprietor_uk_based: true,
    });
    expect(rows[1]).to.include({
      title_no: "TITLE1",
      proprietor_name: "Bob",
      company_registration_no: "",
    });
  });

  it("skips proprietor slots with neither a name nor a company registration number", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Proprietor Name (1)": "Alice",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      false,
    );

    // Assert
    expect(rows).to.have.length(1);
  });

  it("skips rows with no title number and logs the skip count", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Title Number": "",
      "Proprietor Name (1)": "Alice",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      false,
    );

    // Assert
    expect(rows).to.have.length(0);
    expect(loggerErrorStub.calledOnce).to.be.true;
    expect(loggerErrorStub.firstCall.args[0]).to.include("Skipped 1 of 1 rows");
  });

  it("marks rows as not uk based when overseas is true", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Proprietor Name (1)": "Alice",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      true,
    );

    // Assert
    expect(rows[0].proprietor_uk_based).to.be.false;
  });

  it("converts date_proprietor_added from DD-MM-YYYY to YYYY-MM-DD", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Proprietor Name (1)": "Alice",
      "Date Proprietor Added": "15-06-2019",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      false,
    );

    // Assert
    expect(rows[0].date_proprietor_added).to.equal("2019-06-15");
  });

  it("sets date_proprietor_added to null when missing", () => {
    // Arrange
    const ownership: RawOwnership = {
      ...baseOwnership,
      "Proprietor Name (1)": "Alice",
    };

    // Act
    const rows = mapRawOwnershipsToSnapshotRows(
      [ownership],
      snapshotDate,
      false,
    );

    // Assert
    expect(rows[0].date_proprietor_added).to.be.null;
  });
});
