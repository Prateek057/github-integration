const fs = require("fs");

let filesToPush=[
    {path: "README.md", content: fs.readFileSync(__dirname + "/README.md", "utf-8")},
];

exports.getFilesToPush = function () {
    return filesToPush;
};
