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
We ask that contributors create a fork of the repo then submit PRs to the main branch.
All new features or bugfixes on the backend should have [unit tests](https://github.com/DigitalCommons/land-explorer-front-end/wiki/Automated-Testing). The frontend doesn't have unit tests yet.

## 3. Review & Test

Core dev and Contributor PRs should be reviewed by a core dev before merging. And the automated tests that run in the CI pipeline must pass.
After the fix is merged to main, the code will be staging server at
https://dev.app.landexplorer.coop for QA testing. See ../deployment.md for details

## 4. Release

Regular releases also give us something for regular comms to our community. And by doing some basic testing on staging we can help to ensure the quality of releases.
We aim for one release a month. Release testing should confirm a base set of features are working correctly and the fixes that are in the release.

To prepare a release add a tag and Coolify will put it up on staging at
https://stage.app.landexplorer.coop
```
TAG=v1.5.0
git switch main && git pull
git tag $TAG
git push origin $TAG
gh release create $TAG --generate-notes # Build release notes from PRs
gh run watch # Optional, to see the staging deployment
```

To promote that version to production at https://app.landexplorer.coop
```
gh workflow run release-promote.yml -f tag=v1.5.0
```

To list the releases:
```
git fetch --tags origin
git tag -l --sort=-v:refname
gh release list
```

To list the current version on staging and production:
```
git tag --points-at origin/staging
git tag --points-at origin/production
```
