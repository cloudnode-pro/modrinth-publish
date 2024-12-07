import fs from "node:fs/promises";
import path from "node:path";
import * as core from "@actions/core";
import {VersionsManifest} from "./VersionsManifest.js";

// Action inputs
const inputs = {
    apiDomain: core.getInput("api-domain"),
    token: core.getInput("token", {required: true}),
    project: core.getInput("project", {required: true}),
    name: core.getInput("name"),
    version: core.getInput("version", {required: true}),
    channel: core.getInput("channel"),
    featured: core.getInput("featured"),
    changelog: core.getInput("changelog"),
    loaders: core.getInput("loaders", {required: true}),
    gameVersions: core.getInput("game-versions"),
    files: core.getInput("files", {required: true}),
    primaryFile: core.getInput("primary-file"),
    dependencies: core.getInput("dependencies"),
    status: core.getInput("status"),
    requestedStatus: core.getInput("requested-status")
};

// Set input defaults
if (inputs.name === "")
    inputs.name = inputs.version;

if (inputs.channel === "") {
    if (/\balpha\b/.test(inputs.version.toLowerCase()))
        inputs.channel = "alpha";
    else if (/\b(rc\d*|pre\d*|beta)\b/.test(inputs.version.toLowerCase()))
        inputs.channel = "beta";
    inputs.channel = "release";
}

if (inputs.featured === "")
    inputs.featured = inputs.channel === "release";

// Parse inputs
core.info("Parsing inputs…");
const featured = typeof inputs.featured === "boolean" ? inputs.featured : inputs.featured === "true";
const loaders = inputs.loaders.startsWith("[") ? JSON.parse(inputs.loaders) : inputs.loaders.split("\n").map(l => l.trim());
const gameVersions = (inputs.gameVersions.startsWith("[") ? JSON.parse(inputs.gameVersions) : inputs.gameVersions.split("\n").map(l => l.trim())).map(v => v.toLowerCase());
const filePaths = inputs.files.startsWith("[") ? JSON.parse(inputs.files) : inputs.files.split("\n").map(l => l.trim());
const dependencies = JSON.parse(inputs.dependencies);

const changelog = inputs.changelog === "" ? null : inputs.changelog;
const primaryFileName = inputs.primaryFile === "" ? null : inputs.primaryFile;
const requestedStatus = inputs.requestedStatus === "" ? null : inputs.requestedStatus;

// Read files
core.info("Reading files…");
const fileTypesMap = {
    ".mrpack": "application/x-modrinth-modpack+zip",
    ".jar": "application/java-archive",
    ".zip": "application/zip",
};

const files = await Promise.all(filePaths.map(async filePath => {
    const type = fileTypesMap[path.extname(filePath)];
    const data = await fs.readFile(filePath);
    return new File([data], path.basename(filePath), {type});
}));

// If primary file is specified, check that it is present
if (primaryFileName !== null && !files.some(f => f.name === primaryFileName)) {
    core.setFailed(new Error(`Primary file “${primaryFileName}” is not present in the list of files.`));
    process.exit(1);
}

// Expand versions such as 1.21.x
if (gameVersions.some(v => /^\d+\.\d+\.x$/.test(v))) {
    core.info("Fetching Mojang versions manifest…");
    const versionsManifest = await VersionsManifest.fetch();
    for (const version of gameVersions.filter(v => /^\d+\.\d+\.x$/.test(v))) {
        const index = gameVersions.indexOf(version);
        const baseVersion = version.slice(0, -1);
        const versions = versionsManifest.versions.filter(v => v.startsWith(baseVersion));
        gameVersions.splice(index, 1, ...versions);
    }
}

// Build the HTTP request
const formData = new FormData();

formData.set("data", JSON.stringify({
    name: inputs.name,
    version_number: inputs.version,
    changelog,
    dependencies,
    game_versions: gameVersions,
    version_type: inputs.channel,
    loaders,
    featured,
    status: inputs.status,
    requested_status: requestedStatus,
    project_id: inputs.project,
    file_parts: files.map(f => f.name),
    primary_file: primaryFileName ?? undefined,
}));

for (const file of files)
    formData.set(file.name, file, file.name);

const res = await fetch(`https://${inputs.apiDomain}/api/v2/version`, {
    method: "POST",
    headers: {
        "User-Agent": "github.com/cloudnode-pro/modrinth-publish",
        Authorization: inputs.token,
    },
    body: formData,
});
const body = await res.text();
let parsedBody;
try {
    parsedBody = JSON.parse(body);
} catch (err) {
    parsedBody = body;
}

if (!res.ok) {
    core.setFailed(new Error(`Modrinth API returned error status ${res.status}: ${typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody, null, 2)}`));
    process.exit(1);
}

else {
    core.setOutput("version-id", parsedBody.id);
    process.exit(0);
}
