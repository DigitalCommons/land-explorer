import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("bulkCreateLandOwnershipSnapshots", () => {
  let sandbox: sinon.SinonSandbox;
  let bulkCreateStub: sinon.SinonStub;
  let bulkCreateLandOwnershipSnapshots: (typeof import("./land-ownership-snapshot-query.js"))["bulkCreateLandOwnershipSnapshots"];

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    bulkCreateStub = sandbox.stub().resolves();

    ({ bulkCreateLandOwnershipSnapshots } = await esmock(
      "./land-ownership-snapshot-query.js",
      {
        "./models.js": {
          LandOwnershipSnapshotModel: { bulkCreate: bulkCreateStub },
        },
      },
    ));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("does not call bulkCreate when there are no rows to insert", async () => {
    // Act
    await bulkCreateLandOwnershipSnapshots([]);

    // Assert
    expect(bulkCreateStub.called).to.be.false;
  });

  it("inserts with ignoreDuplicates so re-processing the same year doesn't create duplicate rows", async () => {
    // Act
    await bulkCreateLandOwnershipSnapshots([{ title_no: "T1" } as any]);

    // Assert
    expect(bulkCreateStub.firstCall.args[1]).to.include({
      ignoreDuplicates: true,
    });
  });

  it("splits inserts into chunks that respect MAX_ROWS_PER_INSERT", async () => {
    // Arrange - 20001 rows should require 2 bulkCreate calls, capped at 20000 each
    const rows = Array.from(
      { length: 20001 },
      (_, i) => ({ title_no: `TITLE${i}` }) as any,
    );

    // Act
    await bulkCreateLandOwnershipSnapshots(rows);

    // Assert
    expect(bulkCreateStub.callCount).to.equal(2);
    expect(bulkCreateStub.firstCall.args[0]).to.have.length(20000);
    expect(bulkCreateStub.secondCall.args[0]).to.have.length(1);
  });
});

describe("getOwnershipsForProprietorAndYear", () => {
  let sandbox: sinon.SinonSandbox;
  let queryStub: sinon.SinonStub;
  let getOwnershipsForProprietorAndYear: (typeof import("./land-ownership-snapshot-query.js"))["getOwnershipsForProprietorAndYear"];

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    queryStub = sandbox.stub().resolves([]);

    ({ getOwnershipsForProprietorAndYear } = await esmock(
      "./land-ownership-snapshot-query.js",
      {
        "./database.js": {
          sequelize: { query: queryStub },
        },
      },
    ));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("filters by snapshot_date derived from the year, and matches proprietor_name when no company registration number is given", async () => {
    // Act
    await getOwnershipsForProprietorAndYear("Alice", undefined, 2019);

    // Assert
    const [sql] = queryStub.firstCall.args;
    const { replacements } = queryStub.firstCall.args[1];
    expect(sql).to.include("land_ownership_snapshots.proprietor_name = ?");
    expect(sql).to.not.include("company_registration_no = ?");
    expect(replacements).to.deep.equal(["2019-12-31", "Alice"]);
  });

  it("matches company_registration_no on its own, ignoring proprietorName, when a company registration number is given", async () => {
    // Act
    await getOwnershipsForProprietorAndYear("Alice", "12345678", 2019);

    // Assert
    const [sql] = queryStub.firstCall.args;
    const { replacements } = queryStub.firstCall.args[1];
    expect(sql).to.include(
      "land_ownership_snapshots.company_registration_no = ?",
    );
    expect(sql).to.not.include("proprietor_name = ?");
    expect(replacements).to.deep.equal(["2019-12-31", "12345678"]);
  });

  it("joins to land_ownership_polygons on title_no so each row includes a polygon", async () => {
    // Act
    await getOwnershipsForProprietorAndYear("Alice", undefined, 2019);

    // Assert
    const [sql] = queryStub.firstCall.args;
    expect(sql).to.include(
      "INNER JOIN land_ownership_polygons\n      ON land_ownership_snapshots.title_no = land_ownership_polygons.title_no",
    );
  });

  it("returns the rows resolved by the query as-is", async () => {
    // Arrange
    const rows = [
      {
        title_no: "T1",
        property_address: "1 Main St",
        proprietor_name: "Alice",
        company_registration_no: "",
        poly_id: 1,
        geom: { type: "Polygon", coordinates: [] },
      },
    ];
    queryStub.resolves(rows);

    // Act
    const result = await getOwnershipsForProprietorAndYear(
      "Alice",
      undefined,
      2019,
    );

    // Assert
    expect(result).to.deep.equal(rows);
  });

  it("returns an empty array when nothing matches", async () => {
    // Act
    const result = await getOwnershipsForProprietorAndYear(
      "Nobody",
      undefined,
      2019,
    );

    // Assert
    expect(result).to.deep.equal([]);
  });
});
