import { expect } from "chai";
import { addSecretParam } from "./client";

describe("addSecretParam", () => {
  const originalSecret = process.env.BOUNDARY_SERVICE_SECRET;

  afterEach(() => {
    process.env.BOUNDARY_SERVICE_SECRET = originalSecret;
  });

  it("adds the secret from BOUNDARY_SERVICE_SECRET to the request params", () => {
    process.env.BOUNDARY_SERVICE_SECRET = "shh";

    const config = addSecretParam({ params: { foo: "bar" } } as any);

    expect(config.params).to.deep.equal({ foo: "bar", secret: "shh" });
  });

  it("still sets the secret when the request had no existing params", () => {
    process.env.BOUNDARY_SERVICE_SECRET = "shh";

    const config = addSecretParam({} as any);

    expect(config.params).to.deep.equal({ secret: "shh" });
  });
});
