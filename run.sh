#!/usr/bin/env bash

npm install
env GITHUB_OWNER=PrateekSB
env GITHUB_REPO=dummy
env COMMIT_MESSAGE='Updated README'
env FORCE_UPDATE=false
npm run $1
