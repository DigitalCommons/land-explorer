import { expect } from "chai";
import { assert, createSandbox, fake, match, SinonStub } from "sinon";
import bcrypt from "bcrypt";
import { APIError } from "better-auth";
import { postRegistrationFlow, preRegistrationFlow } from "./authUser";
import { APP_USER_MODEL } from "../utils/appUserPlugin";
import { Event } from "../instrument";

// Dependencies to be stubbed https://sinonjs.org/how-to/stub-dependency/
const query = require("../queries/query");
const buttondown = require("../clients/buttondown.client");

const sandbox = createSandbox();

const SIGN_UP_EMAIL_PATH = "/sign-up/email";

// The user Better Auth is about to create, as passed to databaseHooks.user.create
const authUser = {
  id: "auth-user-id",
  name: "Betty Blueberry",
  email: "blueberry@yahoomail.com",
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

// A sign-up body from our registration form
const registrationBody = {
  name: "Betty Blueberry",
  email: "blueberry@yahoomail.com",
  password: "testingtesting123",
  firstName: "Betty",
  lastName: "Blueberry",
  phone: "",
  address1: "1 Fruit Bowl",
  address2: "",
  city: "Fruitville",
  postcode: "",
  organisation: "Yummy fruits",
  organisationNumber: "",
  organisationType: "commercial",
  organisationSubType: "other",
  accountType: "free",
  marketing: true,
};

/**
 * The endpoint context Better Auth passes to the hook. Outside a Better Auth
 * transaction, getCurrentAdapter falls back to ctx.context.adapter, so the fake
 * adapter given here is the one the hook writes through.
 */
const signUpContext = (
  body: Record<string, unknown>,
  adapter: unknown,
  path = SIGN_UP_EMAIL_PATH,
) => ({ path, body, context: { adapter } }) as any;

describe("preRegistrationFlow", () => {
  let adapter: { create: ReturnType<typeof fake> };
  let usernameExist: SinonStub;

  beforeEach(() => {
    adapter = { create: fake.resolves({ id: "42" }) };
    usernameExist = sandbox.stub(query, "usernameExist").resolves(false);
  });

  afterEach(() => {
    sandbox.restore();
  });

  context("Valid registration", () => {
    it("creates the app user through Better Auth's adapter", async () => {
      await preRegistrationFlow(
        authUser,
        signUpContext(registrationBody, adapter),
      );

      assert.calledOnceWithExactly(adapter.create, {
        model: APP_USER_MODEL,
        data: match({
          username: "blueberry@yahoomail.com",
          first_name: "Betty",
          last_name: "Blueberry",
          address1: "1 Fruit Bowl",
          city: "Fruitville",
          organisation: "Yummy fruits",
          organisation_type: "commercial",
          organisation_activity: "other",
          account_type: "free",
          marketing: true,
        }),
      });
    });

    it("stores a hash of the password, not the password", async () => {
      await preRegistrationFlow(
        authUser,
        signUpContext(registrationBody, adapter),
      );

      const { password } = adapter.create.firstCall.args[0].data;
      expect(password).to.not.equal(registrationBody.password);
      expect(bcrypt.compareSync(registrationBody.password, password)).to.be
        .true;
    });

    it("links the new auth user to the app user", async () => {
      const result = await preRegistrationFlow(
        authUser,
        signUpContext(registrationBody, adapter),
      );

      expect(result).to.deep.equal({ data: { ...authUser, appUserId: 42 } });
    });

    it("uses the email Better Auth has normalised as the username", async () => {
      await preRegistrationFlow(
        { ...authUser, email: "blueberry@yahoomail.com" },
        signUpContext(
          { ...registrationBody, email: "Blueberry@yahoomail.com" },
          adapter,
        ),
      );

      expect(adapter.create.firstCall.args[0].data.username).to.equal(
        "blueberry@yahoomail.com",
      );
    });
  });

  context("Invalid registration", () => {
    it("rejects with the validation errors and creates no app user", async () => {
      const error = await preRegistrationFlow(
        authUser,
        signUpContext({ ...registrationBody, firstName: "" }, adapter),
      ).catch((e) => e);

      expect(error).to.be.instanceOf(APIError);
      expect(error.statusCode).to.equal(400);
      expect(error.body.code).to.equal("INVALID_REGISTRATION");
      expect(error.body.errors).to.have.property("firstName");
      assert.notCalled(adapter.create);
    });

    it("rejects an email that is already registered", async () => {
      usernameExist.resolves(true);

      const error = await preRegistrationFlow(
        authUser,
        signUpContext(registrationBody, adapter),
      ).catch((e) => e);

      expect(error).to.be.instanceOf(APIError);
      expect(error.body.errors.username).to.deep.equal([
        "This email has already been registered.",
      ]);
      assert.notCalled(adapter.create);
    });
  });

  context("Creating the app user fails", () => {
    // Better Auth rolls the sign-up back when the hook rejects, so the error must reach it
    it("rejects with the error", async () => {
      const dbError = new Error("Duplicate entry for key 'username'");
      adapter.create = fake.rejects(dbError);

      const error = await preRegistrationFlow(
        authUser,
        signUpContext(registrationBody, adapter),
      ).catch((e) => e);

      expect(error).to.equal(dbError);
    });
  });
});

describe("postRegistrationFlow", () => {
  const appUser = { id: 42, username: "blueberry@yahoomail.com" };
  const linkedUser = { ...authUser, appUserId: 42 };

  let signUpToMarketing: ReturnType<typeof fake>;
  let trackUserEvent: ReturnType<typeof fake>;
  let migrateGuestUserMap: SinonStub;

  beforeEach(() => {
    signUpToMarketing = fake.resolves(undefined);
    trackUserEvent = fake.resolves(undefined);
    sandbox.replace(buttondown, "signUpToMarketing", signUpToMarketing);
    sandbox.replace(query, "getUserById", fake.resolves(appUser));
    migrateGuestUserMap = sandbox
      .stub(query, "migrateGuestUserMap")
      .resolves(0);
    sandbox.replace(query, "trackUserEvent", trackUserEvent);
  });

  afterEach(() => {
    sandbox.restore();
  });
 
  context("No linked app user", () => {
    it("does nothing", async () => {
      await postRegistrationFlow(
        authUser,
        signUpContext(registrationBody, null),
      );

      assert.notCalled(signUpToMarketing);
      assert.notCalled(query.getUserById);
    });
  });

  context("Email sign-up committed", () => {
    it("signs the user up to marketing with their choice", async () => {
      await postRegistrationFlow(
        linkedUser,
        signUpContext(registrationBody, null),
      );

      assert.calledOnceWithExactly(
        signUpToMarketing,
        true,
        "blueberry@yahoomail.com",
      );
    });

    it("moves maps shared before registering onto the app user", async () => {
      await postRegistrationFlow(
        linkedUser,
        signUpContext(registrationBody, null),
      );

      assert.calledOnceWithExactly(query.getUserById, 42);
      assert.calledOnceWithExactly(query.migrateGuestUserMap, appUser);
    });

    it("tracks the registration", async () => {
      await postRegistrationFlow(
        linkedUser,
        signUpContext(registrationBody, null),
      );

      assert.calledOnceWithExactly(
        trackUserEvent,
        match.string,
        42,
        Event.USER.REGISTER,
        { sharedMaps: false },
      );
    });

    it("tracks whether shared maps were moved", async () => {
      migrateGuestUserMap.resolves(2);

      await postRegistrationFlow(
        linkedUser,
        signUpContext(registrationBody, null),
      );

      assert.calledWith(trackUserEvent, match.any, 42, Event.USER.REGISTER, {
        sharedMaps: true,
      });
    });
  });

  context("A post-registration step fails", () => {
    // the sign-up has already committed, so a failure here mustn't fail the request
    it("logs the error rather than rejecting", async () => {
      migrateGuestUserMap.rejects(new Error("DB down"));
      const consoleError = sandbox.stub(console, "error");

      await postRegistrationFlow(
        linkedUser,
        signUpContext(registrationBody, null),
      );

      assert.calledWith(
        consoleError,
        "Post-registration steps failed for",
        "blueberry@yahoomail.com",
        match.instanceOf(Error),
      );
      assert.notCalled(trackUserEvent);
    });
  });
});
