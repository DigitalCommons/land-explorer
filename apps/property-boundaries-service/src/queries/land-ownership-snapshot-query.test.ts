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
