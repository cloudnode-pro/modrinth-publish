import * as core from "@actions/core";
import * as semver from "semver";
import fs from "node:fs/promises";
import path from "node:path";
import {VersionsManifest} from "./VersionsManifest.js";

// Action inputs
const inputs = {
    apiDomain: process.env["INPUT_API-DOMAIN"]!,
    token: process.env.INPUT_TOKEN!,
    project: process.env.INPUT_PROJECT!,
    name: process.env.INPUT_NAME!,
    version: process.env.INPUT_VERSION!,
    channel: process.env.INPUT_CHANNEL!,
    featured: process.env.INPUT_FEATURED!,
    changelog: process.env.INPUT_CHANGELOG!,
    loaders: process.env.INPUT_LOADERS!,
    gameVersions: process.env["INPUT_GAME-VERSIONS"]!,
    files: process.env.INPUT_FILES!,
    primaryFile: process.env["INPUT_PRIMARY-FILE"]!,
    fileTypes: process.env["INPUT_FILE-TYPES"]!,
    dependencies: process.env.INPUT_DEPENDENCIES!,
    status: process.env.INPUT_STATUS!,
    requestedStatus: process.env["INPUT_REQUESTED-STATUS"]!,
}

// Set input defaults
if (inputs.name === "")
    inputs.name = inputs.version;

if (inputs.channel === "") {
    if (/\balpha\b/i.test(inputs.version))
        inputs.channel = "alpha";
    else if (/\b(rc\d*|pre\d*|beta)\b/i.test(inputs.version))
        inputs.channel = "beta";
    else inputs.channel = "release";
}

if (inputs.featured === "")
    inputs.featured = inputs.channel === "release" ? "true" : "false";

if (inputs.fileTypes === "")
    inputs.fileTypes = "{}";

// Parse inputs
core.info("Parsing inputs…");
const featured = inputs.featured === "true";

const loaders = inputs.loaders.startsWith("[")
                ? JSON.parse(inputs.loaders)
                : inputs.loaders.split("\n").map(l => l.trim());

const gameVersions = (inputs.gameVersions.startsWith("[")
                      ? JSON.parse(inputs.gameVersions) as string[]
                      : inputs.gameVersions.split("\n").map(l => l.trim()))
    .map(v => v.trim()).filter(v => v !== "");

const filePaths = inputs.files.startsWith("[")
                  ? JSON.parse(inputs.files) as string[]
                  : inputs.files.split("\n").map(l => l.trim());

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
    ".litemod": "application/zip",
    ".asc": "application/pgp-signature",
    ".sig": "application/pgp-signature"
};

const files = await Promise.all(filePaths.map(async filePath => {
    // Check if the path is a URL
    if (/^https?:\/\//.test(filePath)) {
        const url = new URL(filePath);
        const res = await fetch(url);
        const data = await res.blob();

        return new File([data], path.basename(url.pathname), {type: data.type});
    }

    const data = await fs.readFile(filePath);
    const type = fileTypesMap[path.extname(filePath)];
    return new File([data], path.basename(filePath), {type});
}));

const FILE_TYPES = [
    "required-resource-pack",
    "optional-resource-pack",
    "sources-jar",
    "javadoc-jar",
    "dev-jar",
    "signature"
];

const fileTypes = inputs.fileTypes.startsWith("{")
    ? JSON.parse(inputs.fileTypes) as Record<string, string>
    : inputs.fileTypes.split("\n").reduce((acc, l) => {
        const delimiterIndex = l.lastIndexOf("=");

        const name = l.slice(0, delimiterIndex).trim();
        if (!files.some(f => f.name === name)) {
            core.setFailed(new Error(`Unknown file named “${name}” cannot be assigned a type`));
            process.exit(1);
        }

        const type = l.slice(delimiterIndex + 1).trim();
        if (!FILE_TYPES.includes(type)) {
            core.setFailed(new Error(`Unknown type “${type}” specified for ${name}`));
        }

        acc[name] = type;
        return acc;
    }, {} as Record<string, string>);

// If a primary file is specified, check that it is present
if (primaryFileName !== null && !files.some(f => f.name === primaryFileName)) {
    core.setFailed(new Error(`Primary file “${primaryFileName}” is not present in the list of files.`));
    process.exit(1);
}

// Interpret version ranges such as 1.21.x || >= 26.1
const versionRanges = gameVersions
    .reduce<[index: number, range: string][]>((acc, v, i) => {
        // exclude exact versions (non-ranges)
        // coerce(1.21) → 1.21.0; this is checked because Mojang doesn’t actually follow SemVer (elides .0 patch)
        const coerced = semver.coerce(v, {includePrerelease: true})?.version;
        if (coerced === v || coerced === v + ".0") {
            return acc;
        }

        const r = semver.validRange(v);
        if (r !== null) {
            acc.push([i, r]);
        }
        return acc;
    }, []);

if (versionRanges.length > 0) {
    core.info("Fetching Mojang versions manifest…");
    const versionsManifest = await VersionsManifest.fetch();

    for (const [i] of versionRanges.toReversed()) {
        gameVersions.splice(i, 1);
    }

    for (const v of versionsManifest.versions) {
        const coerced = semver.coerce(v);
        if (coerced !== null && versionRanges.some(([, r]) => semver.satisfies(coerced, r))) {
            gameVersions.push(v);
        }
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
    file_types: fileTypes,
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
    core.setFailed("Modrinth API returned error status"
        + res.status + (res.statusText !== "" ? ` (${res.statusText})` : "") + ": "
        + typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody, null, 2));
    process.exit(1);
}

else {
    core.setOutput("version-id", parsedBody.id);
    core.info(`\x1b[32m✔\x1b[0m Successfully uploaded version on Modrinth.\n\tID: ${parsedBody.id}`);
    process.exit(0);
}
