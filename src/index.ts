import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import core from "@actions/core";
import {VersionsManifest} from "./VersionsManifest.js";

const GH_INPUTS: Record<string, string> = JSON.parse(process.env.GH_INPUTS!);

// Action inputs
const inputs = {
    apiDomain: GH_INPUTS["api-domain"]!,
    token: GH_INPUTS.token!,
    project: GH_INPUTS.project!,
    name: GH_INPUTS.name!,
    version: GH_INPUTS.version!,
    channel: GH_INPUTS.channel!,
    featured: GH_INPUTS.featured!,
    changelog: GH_INPUTS.changelog!,
    loaders: GH_INPUTS.loaders!,
    gameVersions: GH_INPUTS["game-versions"]!,
    files: GH_INPUTS.files!,
    primaryFile: GH_INPUTS["primary-file"]!,
    dependencies: GH_INPUTS.dependencies!,
    status: GH_INPUTS.status!,
    requestedStatus: GH_INPUTS["requested-status"]!,
}

// Set input defaults
if (inputs.name === "")
    inputs.name = inputs.version;

if (inputs.channel === "") {
    if (/\balpha\b/.test(inputs.version.toLowerCase()))
        inputs.channel = "alpha";
    else if (/\b(rc\d*|pre\d*|beta)\b/.test(inputs.version.toLowerCase()))
        inputs.channel = "beta";
    else inputs.channel = "release";
}

if (inputs.featured === "")
    inputs.featured = inputs.channel === "release" ? "true" : "false";

// Parse inputs
core.info("Parsing inputs…");
const featured = inputs.featured === "true";
const loaders = inputs.loaders.startsWith("[") ? JSON.parse(inputs.loaders) : inputs.loaders.split("\n").map(l => l.trim());
const gameVersions = (inputs.gameVersions.startsWith("[") ? JSON.parse(inputs.gameVersions) as string[] : inputs.gameVersions.split("\n").map(l => l.trim())).map(v => v.toLowerCase().trim()).filter(v => v !== "");
const filePaths = inputs.files.startsWith("[") ? JSON.parse(inputs.files) as string[] : inputs.files.split("\n").map(l => l.trim());
const dependencies = JSON.parse(inputs.dependencies);

const changelog = inputs.changelog === "" ? null : inputs.changelog;
const primaryFileName = inputs.primaryFile === "" ? null : inputs.primaryFile;
const requestedStatus = inputs.requestedStatus === "" ? null : inputs.requestedStatus;

// Read files
core.info("Reading files…");
const fileTypesMap: Record<string, string> = {
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
        const baseVersion = version.slice(0, -2);
        const versions = versionsManifest.versions.filter(v => v === baseVersion || v.startsWith(baseVersion + "."));
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

const res = await fetch(`https://${inputs.apiDomain}/v2/version`, {
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
}
catch (err) {
    parsedBody = body;
}

if (!res.ok) {
    core.setFailed(`Modrinth API returned error status ${res.status} (${http.STATUS_CODES[res.status] ?? "unknown"}): ${typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody, null, 2)}`);
    process.exit(1);
}

else {
    core.setOutput("version-id", parsedBody.id);
    core.info(`\x1b[32m✔\x1b[0m Successfully uploaded version on Modrinth.\n\tID: ${parsedBody.id}`);
    process.exit(0);
}
