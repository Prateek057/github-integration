const fs = require("fs");
const {gitCommitPush} = require("./git-commit-push-via-github-api");

process.on("unhandledRejection", console.dir);
process.env.DEBUG = "*";
gitCommitPush({
    // commit to https://github.com/azu/commit-to-github-test
    owner: "PrateekSB",
    repo: "dummy",
    token: "6942649043385ed7a59e021678255f21273f4b64",
    files: [
        {path: "README.md", content: fs.readFileSync(__dirname + "/README.md", "utf-8")},
    ],
    fullyQualifiedRef: "heads/develop",
    forceUpdate: true, // optional default = false
    commitMessage: "HELLO"})
    .then(res => {
        console.log("success", res);x
    })
    .catch(err => {
        console.error(err);
    });
