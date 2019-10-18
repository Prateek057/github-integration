const fs = require("fs");
const {gitCommitPush} = require("./git-commit-push-via-github-api");
const {getFilesToPush} = require("./filesConfig");
const server_debug = require('debug')('server');
const filesToPush = getFilesToPush();
process.on("unhandledRejection", console.dir);
gitCommitPush({
    // commit to https://github.com/azu/commit-to-github-test
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    files: filesToPush,
    fullyQualifiedRef: process.env.FULLY_QUALIFIED_REFERENCE,
    forceUpdate: process.env.FORCE_UPDATE ? Boolean(process.env.FORCE_UPDATE) : false,
    commitMessage: process.env.COMMIT_MESSAGE})
    .then(res => {
        server_debug("success", JSON.stringify(res));
    })
    .catch(err => {
        server_debug(err);
    });
