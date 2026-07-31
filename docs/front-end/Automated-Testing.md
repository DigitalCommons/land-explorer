## Unit Tests

Currently only the backend has unit tests. See its [README](https://github.com/DigitalCommons/land-explorer-back-end/blob/main/README.md#unit-tests) for codebase-specific information on writing unit tests. Here is some general guidance.

### What is a unit test?

A unit test instantiates a unit (a small portion, usually a function) of our app and verifies its behaviour independently from other parts. It is narrow in scope and ideally covers all cases, ensuring that the unit behaves correctly. There are 3 stages (3 As) in a well-structured unit test:

1. **Arrange:** Set up the unit to be tested and the environment.

2. **Act:** Invoke the actual function under test.

3. **Assert:** Make a claim (usually just one) about the unit and/or verify its interaction with a test object.

### Tips for writing a good test

A good unit test is:

* **Readable.** It should be clear which scenario is being tested and— if the test fails— easy to detect how to address the problem. It should be well-structured and include comments where needed. This will make the test easier to maintain.

* **Reliable.** It should fail only if there’s a bug in the code they're testing. A bad test may pass when running one-by-one, but fail when running the whole test suite, or pass on our development machine and fail on the continuous integration server. A good test is repeatable in any environment or running order.

* **Fast.** It should run in a few milliseconds. Avoid writing tests with timeouts and instead look for ways to fake the system clock if needed. All the tests should be run often, on our own machines and in the CI pipeline, to check that no bugs have been introduced. Slow tests will discourage this.

* **Isolated.** Its result should only depend on the unit being tested. To eliminate the influence of external factors, both the test and the unit under test should not access network resources, databases, file system, etc. A good test replaces external interfaces with test objects (e.g. fakes, stubs) that we can control.

### Behaviour-driven development (BDD)

When adding a new feature, we write the code and unit tests together using _behaviour-driven development_ (BDD). The technique produces specifications of the code in non-technical language, making it more understandable, and encourages writing testable, modularised code.

[Here is a useful guide](https://javascript.info/testing-mocha#behavior-driven-development-bdd) on BDD. The usual development flow, which is explained in more detail in the guide, is as follows:

1. An initial spec is written, with tests for the most basic functionality.
1. An initial implementation is created.
1. We run the tests to check whether the code works. While the functionality is not complete, errors are displayed. We make corrections until the tests pass.
1. Now we have a working initial implementation with tests.
1. We add more use cases to the spec, probably not yet supported by the implementations. Tests start to fail.
1. Go to 3, update the implementation till tests give no errors.
1. Repeat steps 3-6 till the functionality is ready.

## How do I run the automated tests?

Currently only the backend has automated tests. See its [README](https://github.com/DigitalCommons/land-explorer-back-end/blob/main/README.md#unit-tests) for instructions on how to run tests locally.
The tests also run in a continuous integration (CI) pipeline, using GitHub Actions. The config for this is [here](https://github.com/DigitalCommons/land-explorer-back-end/blob/main/.github/workflows/node.js.yml).