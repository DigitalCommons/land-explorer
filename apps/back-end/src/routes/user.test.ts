// Chai provides assertions (e.g. expect, assert)
import { expect } from "chai";
// Sinon provides mocks, spies, stubs, etc. We use them to replace and control the behaviour of code
// that is external to our test unit, or to verify how out test unit interfaces with external code.
import { assert, createSandbox, fake, match, SinonSpy } from "sinon";
import { Server } from "@hapi/hapi";
import { init } from "../server";

// Dependencies to be stubbed https://sinonjs.org/how-to/stub-dependency/
const query = require("../queries/query");
const mailer = require("../queries/mails");
const helper = require("../queries/helper");
const Model = require("../queries/database");
const jwt = require("jsonwebtoken");

// We plug all our fakes, spies, etc into the system under test using a sandbox. This makes it
// easier to clean them up after each test.
const sandbox = createSandbox();

let server: Server;

describe("GET /api/user/details", () => {
  const testUserId = 123;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
    sandbox.restore();
  });

  context("User exists", () => {
    it("returns analyticsConsent: true when set", async () => {
      sandbox.replace(
        Model.User,
        "findOne",
        fake.resolves({
          id: testUserId,
          username: "douglas.quaid@yahoomail.com",
          first_name: "Douglas",
          last_name: "Quaid",
          analytics_consent_granted_at: new Date("2024-01-01"),
          analytics_consent_revoked_at: null,
        }),
      );

      const res = await server.inject({
        method: "GET",
        url: "/api/user/details",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
      });

      expect(res.statusCode).to.equal(200);
      expect((res.result as any).analyticsConsent).to.equal(true);
    });

    it("returns analyticsConsent: false when not set", async () => {
      sandbox.replace(
        Model.User,
        "findOne",
        fake.resolves({
          id: testUserId,
          username: "douglas.quaid@yahoomail.com",
          first_name: "Douglas",
          last_name: "Quaid",
          analytics_consent_granted_at: null,
          analytics_consent_revoked_at: new Date("2024-01-01"),
        }),
      );

      const res = await server.inject({
        method: "GET",
        url: "/api/user/details",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
      });

      expect(res.statusCode).to.equal(200);
      expect((res.result as any).analyticsConsent).to.equal(false);
    });

    it("returns analyticsConsent: true when granted_at is more recent than revoked_at", async () => {
      sandbox.replace(
        Model.User,
        "findOne",
        fake.resolves({
          id: testUserId,
          username: "douglas.quaid@yahoomail.com",
          first_name: "Douglas",
          last_name: "Quaid",
          analytics_consent_granted_at: new Date("2024-06-01"),
          analytics_consent_revoked_at: new Date("2024-01-01"),
        }),
      );

      const res = await server.inject({
        method: "GET",
        url: "/api/user/details",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
      });

      expect(res.statusCode).to.equal(200);
      expect((res.result as any).analyticsConsent).to.equal(true);
    });

    it("returns analyticsConsent: false when revoked_at is more recent than granted_at", async () => {
      sandbox.replace(
        Model.User,
        "findOne",
        fake.resolves({
          id: testUserId,
          username: "douglas.quaid@yahoomail.com",
          first_name: "Douglas",
          last_name: "Quaid",
          analytics_consent_granted_at: new Date("2024-01-01"),
          analytics_consent_revoked_at: new Date("2024-06-01"),
        }),
      );

      const res = await server.inject({
        method: "GET",
        url: "/api/user/details",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
      });

      expect(res.statusCode).to.equal(200);
      expect((res.result as any).analyticsConsent).to.equal(false);
    });

    it("returns analyticsConsent: null for existing users before consent migration", async () => {
      sandbox.replace(
        Model.User,
        "findOne",
        fake.resolves({
          id: testUserId,
          username: "douglas.quaid@yahoomail.com",
          first_name: "Douglas",
          last_name: "Quaid",
          analytics_consent_granted_at: null,
          analytics_consent_revoked_at: null,
        }),
      );

      const res = await server.inject({
        method: "GET",
        url: "/api/user/details",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
      });

      expect(res.statusCode).to.equal(200);
      expect((res.result as any).analyticsConsent).to.equal(null);
    });
  });
});

describe("POST /api/user/analytics-consent", () => {
  const testUserId = 123;
  let fakeUserUpdate: SinonSpy;

  beforeEach(async () => {
    server = await init();
    fakeUserUpdate = sandbox.replace(Model.User, "update", fake.resolves([1]));
  });

  afterEach(async () => {
    await server.stop();
    sandbox.restore();
  });

  it("returns status 200 and persists consent when set to true", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/user/analytics-consent",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: { analyticsConsent: true },
    });

    expect(res.statusCode).to.equal(200);
    assert.calledOnceWithMatch(
      fakeUserUpdate,
      { analytics_consent_granted_at: match.instanceOf(Date) },
      { where: { id: testUserId } },
    );
  });

  it("returns status 200 and persists consent when set to false", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/user/analytics-consent",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: { analyticsConsent: false },
    });

    expect(res.statusCode).to.equal(200);
    assert.calledOnceWithMatch(
      fakeUserUpdate,
      { analytics_consent_revoked_at: match.instanceOf(Date) },
      { where: { id: testUserId } },
    );
  });

  it("returns status 400 when payload is missing analyticsConsent", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/user/analytics-consent",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: {},
    });

    expect(res.statusCode).to.equal(400);
  });

  it("returns status 400 when analyticsConsent is not a boolean", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/user/analytics-consent",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: { analyticsConsent: "yes" },
    });

    expect(res.statusCode).to.equal(400);
  });
});

describe("POST /api/user/user-guide-prompt-seen", () => {
  const testUserId = 123;

  let fakeUserUpdate: SinonSpy;
  let fakeTrackUserEvent: SinonSpy;

  beforeEach(async () => {
    server = await init();
    fakeUserUpdate = sandbox.replace(Model.User, "update", fake.resolves(null));
    fakeTrackUserEvent = sandbox.replace(query, "trackUserEvent", fake());
  });

  afterEach(async () => {
    await server.stop();
    sandbox.restore();
  });

  it("returns status 200", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/user/user-guide-prompt-seen",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: {
        userGuidePromptSeen: true,
        viewedUserGuide: false,
        viewedSource: "",
      },
    });

    expect(res.statusCode).to.equal(200);
  });

  it("updates user_guide_prompt_seen for the authenticated user", async () => {
    await server.inject({
      method: "POST",
      url: "/api/user/user-guide-prompt-seen",
      auth: { strategy: "simple", credentials: { user_id: testUserId } },
      payload: {
        userGuidePromptSeen: true,
        viewedUserGuide: false,
        viewedSource: "",
      },
    });

    assert.calledOnceWithMatch(
      fakeUserUpdate,
      { user_guide_prompt_seen: true },
      { where: { id: testUserId } },
    );
  });

  context("when viewedUserGuide is true", () => {
    it("tracks a USER_GUIDE_VIEWED analytics event with the source", async () => {
      await server.inject({
        method: "POST",
        headers: { "x-session-id": "test-session-id" },
        url: "/api/user/user-guide-prompt-seen",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
        payload: {
          userGuidePromptSeen: true,
          viewedUserGuide: true,
          viewedSource: "button",
        },
      });

      assert.calledOnceWithMatch(
        fakeTrackUserEvent,
        "test-session-id",
        testUserId,
        "User_ViewedGuide",
        { source: "button" },
      );
    });
  });

  context("when viewedUserGuide is false", () => {
    it("does not track an analytics event", async () => {
      await server.inject({
        method: "POST",
        url: "/api/user/user-guide-prompt-seen",
        auth: { strategy: "simple", credentials: { user_id: testUserId } },
        payload: {
          userGuidePromptSeen: false,
          viewedUserGuide: false,
          viewedSource: "",
        },
      });

      assert.notCalled(fakeTrackUserEvent);
    });
  });
});
