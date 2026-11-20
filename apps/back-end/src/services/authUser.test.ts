import { expect } from "chai";
import { assert, createSandbox, fake, match, SinonStub } from "sinon";
import bcrypt from "bcrypt";
import { APIError } from "better-auth";
import { runWithEndpointContext } from "@better-auth/core/context";
import {
  confirmPasswordForEmailChange,
  postEmailVerificationFlow,
  postRegistrationFlow,
  preEmailChangeFlow,
  preNameChangeFlow,
  preRegistrationFlow,
  preUserUpdateFlow,
  splitName,
} from "./authUser";
import { APP_USER_MODEL } from "../utils/appUserPlugin";
import { Event } from "../instrument";

// Dependencies to be stubbed https://sinonjs.org/how-to/stub-dependency/
const query = require("../queries/query");
const buttondown = require("../clients/buttondown.client");
const email = require("../emails/email");

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

describe("splitName", () => {
  it("takes the first word as the first name and the rest as the last name", () => {
    expect(splitName("  Betty  Bo Blueberry ")).to.eql({ first_name: "Betty", last_name: "Bo Blueberry" });
  });

  it("splits two words into first and last names", () => {
    expect(splitName("Betty Blueberry")).to.eql({ first_name: "Betty", last_name: "Blueberry" });
  });

  it("puts every word after the first into the last name", () => {
    expect(splitName("Betty Mary Ann Blueberry")).to.eql({ first_name: "Betty", last_name: "Mary Ann Blueberry" });
  });

  it("takes a single word as the first name", () => {
    expect(splitName("Betty")).to.eql({ first_name: "Betty", last_name: "" });
  });
});

describe("preNameChangeFlow", () => {
  let adapter: { update: ReturnType<typeof fake> };

  const updateUserContext = (path = "/update-user", appUserId: number | null = 7) =>
    ({ path, body: {}, context: { adapter, session: { user: { appUserId } } } }) as any;

  beforeEach(() => {
    adapter = { update: fake.resolves({}) };
  });

  it("updates the first and last names on the app user", async () => {
    await preNameChangeFlow({ name: "Betty Bo Blueberry" }, updateUserContext());

    assert.calledOnceWithExactly(adapter.update, {
      model: APP_USER_MODEL,
      where: [{ field: "id", value: 7 }],
      update: { first_name: "Betty", last_name: "Bo Blueberry" },
    });
  });

  it("does nothing when the name isn't changing", async () => {
    await preNameChangeFlow({ image: "avatar.png" }, updateUserContext());
    assert.notCalled(adapter.update);
  });

  it("rejects a single name", async () => {
    const error = await preNameChangeFlow({ name: " Betty " }, updateUserContext()).catch((e) => e);

    expect(error).to.be.instanceOf(APIError);
    expect(error.body.code).to.equal("INVALID_NAME");
    assert.notCalled(adapter.update);
  });

  it("rejects a blank name", async () => {
    const error = await preNameChangeFlow({ name: "   " }, updateUserContext()).catch((e) => e);

    expect(error).to.be.instanceOf(APIError);
    expect(error.body.code).to.equal("INVALID_NAME");
    assert.notCalled(adapter.update);
  });

  it("rejects a name that isn't a string", async () => {
    const error = await preNameChangeFlow({ name: null } as any, updateUserContext()).catch((e) => e);

    expect(error).to.be.instanceOf(APIError);
    expect(error.body.code).to.equal("INVALID_NAME");
    assert.notCalled(adapter.update);
  });

  it("does nothing on other endpoints", async () => {
    await preNameChangeFlow({ name: "Betty" }, updateUserContext("/sign-up/email"));
    assert.notCalled(adapter.update);
  });

  it("does nothing without an app user", async () => {
    await preNameChangeFlow({ name: "Betty Blueberry" }, updateUserContext("/update-user", null));
    assert.notCalled(adapter.update);
  });
});

describe("confirmPasswordForEmailChange", () => {
  const REQUEST_EMAIL_CHANGE_PATH = "/email-otp/request-email-change";

  let findCredentialAccount: ReturnType<typeof fake>;
  let verify: ReturnType<typeof fake>;
  let usernameExist: SinonStub;

  // The session is given on the context, which getSessionFromCtx returns as it is
  const requestContext = (
    body: Record<string, unknown>,
    { path = REQUEST_EMAIL_CHANGE_PATH, session = { user: { id: "auth-user-id" } } as unknown } = {},
  ) =>
    ({
      path,
      body,
      context: {
        session,
        internalAdapter: { findCredentialAccount },
        password: { verify },
      },
    }) as any;

  beforeEach(() => {
    findCredentialAccount = fake.resolves({ password: "stored-hash" });
    verify = fake.resolves(true);
    usernameExist = sandbox.stub(query, "usernameExist").resolves(false);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("lets a request with the right password and a valid new email through", async () => {
    await confirmPasswordForEmailChange(
      requestContext({ newEmail: "new@yahoomail.com", password: "testingtesting123" }),
    );

    assert.calledOnceWithExactly(findCredentialAccount, "auth-user-id");
    assert.calledOnceWithExactly(verify, { hash: "stored-hash", password: "testingtesting123" });
  });

  it("rejects a wrong password", async () => {
    verify = fake.resolves(false);
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "new@yahoomail.com", password: "wrong" }),
    ).catch((e) => e);

    expect(error).to.be.instanceOf(APIError);
    expect(error.body.code).to.equal("INVALID_PASSWORD");
  });

  it("rejects a missing password without checking it", async () => {
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "new@yahoomail.com" }),
    ).catch((e) => e);

    expect(error.body.code).to.equal("INVALID_PASSWORD");
    assert.notCalled(verify);
  });

  it("rejects an account with no password", async () => {
    findCredentialAccount = fake.resolves(null);
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "new@yahoomail.com", password: "testingtesting123" }),
    ).catch((e) => e);

    expect(error.body.code).to.equal("INVALID_PASSWORD");
  });

  it("rejects a new email that another account uses", async () => {
    usernameExist.resolves(true);
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "taken@yahoomail.com", password: "testingtesting123" }),
    ).catch((e) => e);

    expect(error.body.code).to.equal("INVALID_NEW_EMAIL");
    expect(error.body.message).to.equal("An account already exists with this email.");
  });

  it("rejects an invalid new email", async () => {
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "not-an-email", password: "testingtesting123" }),
    ).catch((e) => e);

    expect(error.body.code).to.equal("INVALID_NEW_EMAIL");
  });

  it("checks the password before the new email, so a wrong password doesn't reveal whether an email is taken", async () => {
    verify = fake.resolves(false);
    usernameExist.resolves(true);
    const error = await confirmPasswordForEmailChange(
      requestContext({ newEmail: "taken@yahoomail.com", password: "wrong" }),
    ).catch((e) => e);

    expect(error.body.code).to.equal("INVALID_PASSWORD");
    assert.notCalled(usernameExist);
  });

  it("does nothing on other endpoints", async () => {
    await confirmPasswordForEmailChange(
      requestContext({ password: "wrong" }, { path: "/sign-in/email" }),
    );

    assert.notCalled(findCredentialAccount);
  });
});

describe("preEmailChangeFlow", () => {
  const CHANGE_EMAIL_PATH = "/email-otp/change-email";

  let adapter: { update: ReturnType<typeof fake> };
  let usernameExist: SinonStub;

  const changeEmailContext = (path = CHANGE_EMAIL_PATH, appUserId: number | null = 7) =>
    ({ path, body: {}, context: { adapter, session: { user: { appUserId } } } }) as any;

  beforeEach(() => {
    adapter = { update: fake.resolves({}) };
    usernameExist = sandbox.stub(query, "usernameExist").resolves(false);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("updates the username on the app user to the new email", async () => {
    await preEmailChangeFlow({ email: "new@yahoomail.com" }, changeEmailContext());

    assert.calledOnceWithExactly(adapter.update, {
      model: APP_USER_MODEL,
      where: [{ field: "id", value: 7 }],
      update: { username: "new@yahoomail.com" },
    });
  });

  it("rejects an email another account took after the code was sent", async () => {
    usernameExist.resolves(true);
    const error = await preEmailChangeFlow({ email: "taken@yahoomail.com" }, changeEmailContext()).catch(
      (e) => e,
    );

    expect(error).to.be.instanceOf(APIError);
    expect(error.body.code).to.equal("INVALID_NEW_EMAIL");
    assert.notCalled(adapter.update);
  });

  it("does nothing when the email isn't changing", async () => {
    await preEmailChangeFlow({ name: "Betty Blueberry" }, changeEmailContext());
    assert.notCalled(usernameExist);
    assert.notCalled(adapter.update);
  });

  it("does nothing on other endpoints", async () => {
    await preEmailChangeFlow({ email: "new@yahoomail.com" }, changeEmailContext("/update-user"));
    assert.notCalled(adapter.update);
  });

  it("does nothing without an app user", async () => {
    await preEmailChangeFlow({ email: "new@yahoomail.com" }, changeEmailContext(CHANGE_EMAIL_PATH, null));
    assert.notCalled(adapter.update);
  });
});

describe("preUserUpdateFlow", () => {
  let adapter: { update: ReturnType<typeof fake> };

  const context = (path: string) =>
    ({ path, body: {}, context: { adapter, session: { user: { appUserId: 7 } } } }) as any;

  beforeEach(() => {
    adapter = { update: fake.resolves({}) };
    sandbox.stub(query, "usernameExist").resolves(false);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("updates the username when the email is changed", async () => {
    await preUserUpdateFlow({ email: "new@yahoomail.com" }, context("/email-otp/change-email"));
    assert.calledOnceWithMatch(adapter.update, { update: { username: "new@yahoomail.com" } });
  });

  it("updates the first and last names when the name is changed", async () => {
    await preUserUpdateFlow({ name: "Betty Blueberry" }, context("/update-user"));
    assert.calledOnceWithMatch(adapter.update, { update: { first_name: "Betty", last_name: "Blueberry" } });
  });

  it("rejects a single name from the profile", async () => {
    const error = await preUserUpdateFlow({ name: "Betty" }, context("/update-user")).catch((e) => e);
    expect(error.body.code).to.equal("INVALID_NAME");
  });
});

describe("postEmailVerificationFlow", () => {
  const appUser = { id: 42, first_name: "Betty" };
  const verifiedUser = { ...authUser, emailVerified: true, appUserId: 42 };
  const DAY_MS = 24 * 60 * 60 * 1000;

  let sendRegisteredEmail: ReturnType<typeof fake>;

  // the endpoint the verification came through, which the flow reads from Better Auth's context
  const verifiedThrough = (path: string, user: typeof verifiedUser) =>
    runWithEndpointContext({ path } as any, () => postEmailVerificationFlow(user));

  beforeEach(() => {
    sendRegisteredEmail = fake();
    sandbox.replace(email, "sendRegisteredEmail", sendRegisteredEmail);
    sandbox.replace(query, "getUserById", fake.resolves(appUser));
    sandbox.replace(process.env, "BETTER_AUTH_URL", "https://landexplorer.test");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("sends a new sign-up the welcome email", async () => {
    await verifiedThrough("/email-otp/verify-email", verifiedUser);

    assert.calledOnceWithExactly(
      sendRegisteredEmail,
      "blueberry@yahoomail.com",
      "Betty",
      "https://landexplorer.test/app",
    );
  });

  it("sends the welcome email to a user who signed up 6 days ago", async () => {
    await verifiedThrough("/email-otp/verify-email", {
      ...verifiedUser,
      createdAt: new Date(Date.now() - 6 * DAY_MS),
    });

    assert.calledOnce(sendRegisteredEmail);
  });

  it("doesn't send it to a migrated user, who first registered over a week ago", async () => {
    await verifiedThrough("/email-otp/verify-email", {
      ...verifiedUser,
      createdAt: new Date(Date.now() - 8 * DAY_MS),
    });

    assert.notCalled(sendRegisteredEmail);
  });

  it("doesn't send it when the email was verified by changing it", async () => {
    await verifiedThrough("/email-otp/change-email", verifiedUser);
    assert.notCalled(sendRegisteredEmail);
  });

  it("does nothing without a linked app user", async () => {
    await verifiedThrough("/email-otp/verify-email", { ...verifiedUser, appUserId: undefined as any });
    assert.notCalled(sendRegisteredEmail);
  });

  it("logs the error rather than rejecting", async () => {
    sandbox.restore();
    sandbox.replace(email, "sendRegisteredEmail", sendRegisteredEmail);
    sandbox.replace(query, "getUserById", fake.rejects(new Error("database down")));
    const consoleError = sandbox.stub(console, "error");

    await verifiedThrough("/email-otp/verify-email", verifiedUser);

    assert.notCalled(sendRegisteredEmail);
    assert.calledOnce(consoleError);
  });
});
