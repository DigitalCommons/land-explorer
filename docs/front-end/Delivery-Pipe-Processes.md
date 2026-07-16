Our delivery pipe has the following stages: 
1. Inception & Prioritisation
2. Development
3. Review & Test
4. Release

## 1. Inception and Prioritisation

Enhancement and development tasks will come from:
- Bugs
- User Feature requests
- Roadmap
- Tech Debt

User feature requests space coming soon.
Published roadmap coming soon.
Prioritisation happens in fortnightly team meetings.

Bugs are prioritised by considering the following criteria:
- How many users are impacted?
- How critical is the feature impacted?
- Is there a workaround?

## 2. Development

Development happens on local machines and is committed to Github regularly. 
We ask that contributors create a fork of the repo then submit PRs to the development branch.
All new features or bugfixes on the backend should have [unit tests](https://github.com/DigitalCommons/land-explorer-front-end/wiki/Automated-Testing). The frontend doesn't have unit tests yet.

## 3. Review & Test

Core dev and Contributor PRs should be reviewed by a core dev before merging. And the automated tests that run in the CI pipeline must pass.
After the fix is merged to development, the code will be [automatically deployed to the staging server](https://github.com/DigitalCommons/land-explorer-front-end/wiki/Deployment-Processes#continuous-delivery-only-on-staging) for QA testing.

## 4. Release

Regular releases also give us something for regular comms to our community. And by doing some basic testing on staging we can help to ensure the quality of releases. 
We aim for one release a month. Release testing should confirm a base set of features are working correctly and the fixes that are in the release. We can use the commit descriptions to build release notes. 
