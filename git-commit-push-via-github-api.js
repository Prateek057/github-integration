"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let GitHubApi = require("@octokit/rest");
let debug = require("debug")("git-commit-push-via-github-api");
let GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;
let getReferenceCommit = function (github, options) {
    return new Promise(function (resolve, reject) {
        github.git.getRef({
            owner: options.owner,
            repo: options.repo,
            ref: options.fullyQualifiedRef
        }, function (err, res) {
            if (err) {
                debug("getReferenceCommit Error", JSON.stringify(err, null, "  "));
                return reject(err);
            }
            debug("getReferenceCommit Response: %O", res);
            return resolve({ referenceCommitSha: res.data.object.sha });
        });
    });
};
let createTree = function (github, options, data) {
    return new Promise(function (resolve, reject) {
        let promises = options.files.map(function (file) {
            if (typeof file.path === "string" && typeof file.content === "string") {
                return github.git
                    .createBlob({
                        owner: options.owner,
                        repo: options.repo,
                        content: file.content,
                        encoding: "utf-8"
                    })
                    .then(function (blob) {
                        return {
                            sha: blob.data.sha,
                            path: file.path,
                            mode: "100644",
                            type: "blob"
                        };
                    });
            }
            else if (typeof file.path === "string" && Buffer.isBuffer(file.content)) {
                return github.git
                    .createBlob({
                        owner: options.owner,
                        repo: options.repo,
                        content: file.content.toString("base64"),
                        encoding: "base64"
                    })
                    .then(function (blob) {
                        return {
                            sha: blob.data.sha,
                            path: file.path,
                            mode: "100644",
                            type: "blob"
                        };
                    });
            }
            throw new Error("This file can not handled: " + file);
        });
        return Promise.all(promises).then(function (files) {
            debug("files: %O", files);
            // TODO: d.ts bug?
            github.git.createTree({
                owner: options.owner,
                repo: options.repo,
                tree: files,
                base_tree: data.referenceCommitSha
            }, function (err, res) {
                if (err) {
                    debug("createTree", JSON.stringify(err, null, "  "));
                    return reject(err);
                }
                debug("createTree Response: %O", res);
                return resolve(Object.assign(data, { newTreeSha: res.data.sha }));
            });
        });
    });
};
let createCommit = function (github, options, data) {
    return new Promise(function (resolve, reject) {
        github.git.createCommit({
            owner: options.owner,
            repo: options.repo,
            message: options.commitMessage || "commit",
            tree: data.newTreeSha,
            parents: [data.referenceCommitSha]
        }, function (err, res) {
            if (err) {
                debug("createCommit", JSON.stringify(err, null, "  "));
                return reject(err);
            }
            debug("createCommit Response: %O", res);
            return resolve(Object.assign(data, { newCommitSha: res.data.sha }));
        });
    });
};
let updateReference = function (github, options, data) {
    return new Promise(function (resolve, reject) {
        github.git.updateRef({
            owner: options.owner,
            repo: options.repo,
            ref: options.fullyQualifiedRef,
            sha: data.newCommitSha,
            force: options.forceUpdate
        }, function (err, data) {
            if (err) {
                debug("updateReference", JSON.stringify(err, null, "  "));
                return reject(err);
            }
            debug("updateReference Response: %O", data);
            return resolve(data);
        });
    });
};
exports.gitCommitPush = function (options) {
    if (!options.owner || !options.repo || !options.files || !options.files.length) {
        return "";
    }
    let token = options.token || GITHUB_API_TOKEN;
    if (!token) {
        throw new Error("token is not defined");
    }
    let gitHub = new GitHubApi({
        auth: `token ${token}`
    });
    let filledOptions = {
        owner: options.owner,
        repo: options.repo,
        files: options.files,
        fullyQualifiedRef: options.fullyQualifiedRef || "heads/dev",
        forceUpdate: options.forceUpdate || false,
        commitMessage: options.commitMessage || "Commit - " + new Date().getTime().toString()
    };
    debug("options %O", options);
    return getReferenceCommit(gitHub, filledOptions)
        .then(function (data) { return createTree(gitHub, filledOptions, data); })
        .then(function (data) { return createCommit(gitHub, filledOptions, data); })
        .then(function (data) { return updateReference(gitHub, filledOptions, data); });
};
//# sourceMappingURL=git-commit-push-via-github-api.js.map
