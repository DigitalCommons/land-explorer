import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("updateOwnershipSnapshots", function () {
  let sandbox: sinon.SinonSandbox;
  let clock: sinon.SinonFakeTimers | undefined;
  let getFullUKDatasetStub: sinon.SinonStub;
  let getFullOverseasDatasetStub: sinon.SinonStub;
  let getLatestOwnershipSnapshotDataDateStub: sinon.SinonStub;
  let setPipelineLatestOwnershipSnapshotDataStub: sinon.SinonStub;
  let notifyMatrixStub: sinon.SinonStub;
  let pipeZippedCsvFromUrlIntoFunStub: sinon.SinonStub;
  let bulkCreateLandOwnershipSnapshotsStub: sinon.SinonStub;

  // esmock's dynamic import relies on the real Date/clock, so only fake time after the module
  // (and its mocked dependencies) have finished loading, not while it's being imported.
  const loadModule = async () => {
    const mod = await esmock("./update-ownership-snapshots.js", {
      "../../gov-api/client.js": {
        getFullUKDataset: getFullUKDatasetStub,
        getFullOverseasDataset: getFullOverseasDatasetStub,
      },
      "../../queries/pipeline-query.js": {
        getLatestOwnershipSnapshotDataDate:
          getLatestOwnershipSnapshotDataDateStub,
        setPipelineLatestOwnershipSnapshotData:
          setPipelineLatestOwnershipSnapshotDataStub,
      },
      "../logger.js": {
        logger: { info: sandbox.stub(), error: sandbox.stub() },
      },
      "../util.js": { notifyMatrix: notifyMatrixStub },
      "../ownerships/helpers.js": {
        pipeZippedCsvFromUrlIntoFun: pipeZippedCsvFromUrlIntoFunStub,
      },
      "../../queries/land-ownership-snapshot-query.js": {
        bulkCreateLandOwnershipSnapshots: bulkCreateLandOwnershipSnapshotsStub,
      },
    });
    // Fix "today" to 1 March 2020, so the last completed year is always 2019
    clock = sinon.useFakeTimers({
      now: new Date(2020, 2, 1),
      toFake: ["Date"],
    });
    return mod;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    getFullUKDatasetStub = sandbox.stub().resolves({ downloadUrl: "uk-url" });
    getFullOverseasDatasetStub = sandbox
      .stub()
      .resolves({ downloadUrl: "overseas-url" });
    getLatestOwnershipSnapshotDataDateStub = sandbox.stub().resolves(null);
    setPipelineLatestOwnershipSnapshotDataStub = sandbox.stub().resolves();
    notifyMatrixStub = sandbox.stub().resolves();
    pipeZippedCsvFromUrlIntoFunStub = sandbox.stub().resolves();
    bulkCreateLandOwnershipSnapshotsStub = sandbox.stub().resolves();
  });

  afterEach(() => {
    clock?.restore();
    sandbox.restore();
  });

  const processedYears = () =>
    setPipelineLatestOwnershipSnapshotDataStub
      .getCalls()
      .map((call) => (call.args[0] as Date).getFullYear());

  it("backfills every year from 2017 to the last completed year when no snapshot data exists", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(null);
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert
    expect(processedYears()).to.deep.equal([2017, 2018, 2019]);
    expect(getFullUKDatasetStub.callCount).to.equal(3);
    expect(getFullOverseasDatasetStub.callCount).to.equal(3);
  });

  it("only processes years after the latest stored snapshot date", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(new Date(2018, 11, 31));
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert
    expect(processedYears()).to.deep.equal([2019]);
  });

  it("does nothing when the latest snapshot already covers the last completed year (idempotency)", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(new Date(2019, 11, 31));
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert
    expect(setPipelineLatestOwnershipSnapshotDataStub.called).to.be.false;
    expect(getFullUKDatasetStub.called).to.be.false;
    expect(bulkCreateLandOwnershipSnapshotsStub.called).to.be.false;
  });

  it("re-running for a year that's already been recorded doesn't reprocess or duplicate it", async () => {
    // Arrange - latest snapshot is already 2019 (the last completed year), simulating a second run
    // of the pipeline after a successful backfill
    getLatestOwnershipSnapshotDataDateStub.resolves(new Date(2019, 11, 31));
    const { updateOwnershipSnapshots } = await loadModule();

    // Act - run twice, as a real pipeline would across two schedules
    await updateOwnershipSnapshots();
    await updateOwnershipSnapshots();

    // Assert
    expect(setPipelineLatestOwnershipSnapshotDataStub.called).to.be.false;
    expect(bulkCreateLandOwnershipSnapshotsStub.called).to.be.false;
  });

  it("downloads the January dataset of the following year and feeds rows into bulkCreateLandOwnershipSnapshots", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(new Date(2018, 11, 31));
    pipeZippedCsvFromUrlIntoFunStub.callsFake(async (_url, processFn) => {
      await processFn([{ "Title Number": "T1" }]);
    });
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert - 2019 snapshot data comes from the January 2020 FULL dataset
    expect(getFullUKDatasetStub.calledWith(1, 2020)).to.be.true;
    expect(getFullOverseasDatasetStub.calledWith(1, 2020)).to.be.true;
    expect(bulkCreateLandOwnershipSnapshotsStub.calledTwice).to.be.true;

    const [ukCallArgs, overseasCallArgs] =
      bulkCreateLandOwnershipSnapshotsStub.args;
    expect(ukCallArgs[1]).to.deep.equal(new Date(2019, 11, 31));
    expect(ukCallArgs[2]).to.equal(false); // not overseas
    expect(overseasCallArgs[2]).to.equal(true); // overseas
  });

  it("halts further processing and notifies matrix if the UK dataset download fails", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(null);
    getFullUKDatasetStub.resolves(null);
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert - should stop at the first year (2017), never recording progress or trying 2018/2019
    expect(setPipelineLatestOwnershipSnapshotDataStub.called).to.be.false;
    expect(getFullUKDatasetStub.callCount).to.equal(1);
    expect(notifyMatrixStub.calledWithMatch(sinon.match(/🔴/))).to.be.true;
  });

  it("halts further processing and notifies matrix if the overseas dataset download fails", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(null);
    getFullOverseasDatasetStub.resolves(null);
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert
    expect(setPipelineLatestOwnershipSnapshotDataStub.called).to.be.false;
    expect(notifyMatrixStub.calledWithMatch(sinon.match(/🔴/))).to.be.true;
  });

  it("sends a success notification listing the processed years", async () => {
    // Arrange
    getLatestOwnershipSnapshotDataDateStub.resolves(new Date(2018, 11, 31));
    const { updateOwnershipSnapshots } = await loadModule();

    // Act
    await updateOwnershipSnapshots();

    // Assert
    expect(notifyMatrixStub.calledWithMatch(sinon.match(/2019/))).to.be.true;
    expect(notifyMatrixStub.calledWithMatch(sinon.match(/✅/))).to.be.true;
  });
});
