"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let GitHubApi = require("@octokit/rest");
let git_commit_debug = require("debug")("git-commit-push-via-github-api");
let GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;
let getReferenceCommit = function (github, options) {
    return new Promise(function (resolve, reject) {
        github.git.getRef({
            owner: options.owner,
            repo: options.repo,
            ref: options.fullyQualifiedRef
        }).then(res => {
            git_commit_debug("getReferenceCommit Response: %O", res);
            return resolve({ referenceCommitSha: res.data.object.sha });
        }).catch(err => {
            git_commit_debug("getReferenceCommit Error", JSON.stringify(err, null, "  "));
            return reject(err);
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
            git_commit_debug("files: %O", files);
            // TODO: d.ts bug?
            github.git.createTree({
                owner: options.owner,
                repo: options.repo,
                tree: files,
                base_tree: data.referenceCommitSha
            }).then(res => {
                git_commit_debug("createTree Response: %O", res);
                return resolve(Object.assign(data, { newTreeSha: res.data.sha }));
            }).catch(err => {
                git_commit_debug("createTree", JSON.stringify(err, null, "  "));
                return reject(err);
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
        }).then(res => {
            git_commit_debug("createCommit Response: %O", res);
            return resolve(Object.assign(data, { newCommitSha: res.data.sha }));
        }).catch(err => {
            git_commit_debug("createCommit", JSON.stringify(err, null, "  "));
            return reject(err);
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
        }).then(data => {
            git_commit_debug("updateReference Response: %O", data);
            return resolve(data);
        }).catch(err => {
            git_commit_debug("updateReference", JSON.stringify(err, null, "  "));
            return reject(err);
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
        auth: `${token}`
    });
    let filledOptions = {
        owner: options.owner,
        repo: options.repo,
        files: options.files,
        fullyQualifiedRef: options.fullyQualifiedRef,
        forceUpdate: options.forceUpdate || false,
        commitMessage: options.commitMessage || "Commit - " + new Date().getTime().toString()
    };
    return getReferenceCommit(gitHub, filledOptions)
        .then(function (data) { return createTree(gitHub, filledOptions, data); })
        .then(function (data) { return createCommit(gitHub, filledOptions, data); })
        .then(function (data) { return updateReference(gitHub, filledOptions, data); });
};
