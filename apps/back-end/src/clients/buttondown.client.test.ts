import { expect } from "chai";
import { assert, createSandbox } from "sinon";
import { AxiosError } from "axios";
import { buttonDownClient, signUpToMarketing } from "./buttondown.client";

const sandbox = createSandbox();

const buttondownError = (code: string) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    data: { code },
  } as any);

describe("signUpToMarketing", () => {
  const email = "someone@example.com";

  afterEach(() => {
    sandbox.restore();
  });

  it("does not contact Buttondown when the user has not opted in", async () => {
    const post = sandbox.stub(buttonDownClient, "post").resolves();

    await signUpToMarketing(false, email);

    assert.notCalled(post);
  });

  it("subscribes the email with the registration page as referrer", async () => {
    const post = sandbox.stub(buttonDownClient, "post").resolves();

    await signUpToMarketing(true, email);

    assert.calledOnceWithExactly(post, "/subscribers", {
      email,
      referrer_url: "https://app.landexplorer.coop/register",
    });
  });

  it("logs, without erroring, when the email is already subscribed", async () => {
    // On 2026-07-31 the whole stack crashed when someone already subscribed
    // to the newsletter tried to make an account
    sandbox
      .stub(buttonDownClient, "post")
      .rejects(buttondownError("email_already_exists"));
    const log = sandbox.stub(console, "log");
    const error = sandbox.stub(console, "error");

    await signUpToMarketing(true, email);

    assert.calledWith(log, "Buttondown: already subscribed:", email);
    assert.notCalled(error);
  });

  it("logs the Buttondown error code on any other API failure", async () => {
    sandbox
      .stub(buttonDownClient, "post")
      .rejects(buttondownError("email_invalid"));
    const error = sandbox.stub(console, "error");

    await signUpToMarketing(true, email);

    assert.calledWith(
      error,
      "Buttondown subscribe failed for",
      email,
      "email_invalid"
    );
  });

  it("logs the error message when there is no Buttondown error code", async () => {
    sandbox.stub(buttonDownClient, "post").rejects(new Error("timeout"));
    const error = sandbox.stub(console, "error");

    await signUpToMarketing(true, email);

    assert.calledWith(error, "Buttondown subscribe failed for", email, "timeout");
  });

  it("never rejects, so a failed subscription cannot crash registration", async () => {
    sandbox.stub(buttonDownClient, "post").rejects(new Error("boom"));
    sandbox.stub(console, "error");

    let thrown: unknown;
    try {
      await signUpToMarketing(true, email);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).to.equal(undefined);
  });
});
