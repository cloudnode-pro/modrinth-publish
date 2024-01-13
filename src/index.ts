import core from "@actions/core";
import github from "@actions/github";
import {ReleaseEvent} from "@octokit/webhooks-definitions/schema";
import ModrinthCreateVersion from "./ModrinthCreateVersion";
import FilePointer from "./FilePointer";
import InferData from "./InferData";

if (github.context.eventName !== "release") {
    core.warning("This action only works for release events. Current event: " + github.context.eventName);
    process.exit(0);
}

const event: ReleaseEvent = github.context.payload as ReleaseEvent;

const inputs = {
    token: core.getInput("token", {required: true}),
    project: core.getInput("project", {required: true}),
    file: core.getInput("file", {required: true}),
    changelog: (() => {
        const input = core.getInput("changelog");
        return input === "" ? event.release.body ?? "" : input;
    })(),
    loaders: (() => {
        const input = core.getInput("loaders", {required: true});
        return input.startsWith("[") ? JSON.parse(input) as string[] : input.split(",").map(s => s.trim());
    })(),
    dependencies: (() => {
        const input = core.getInput("dependencies", {required: false});
        return input === "" ? [] : JSON.parse(input) as {version_id?: string, project_id?: string, file_name?: string, dependency_type: "required" | "optional" | "incompatible" | "embedded"}[]
    })
} as const;

core.debug("inputs: " + JSON.stringify(inputs));

if (inputs.loaders.length === 0) {
    core.setFailed("No loaders provided");
    process.exit(1);
}

const primaryFile = new FilePointer(inputs.file);

let inferredData: InferData | null;
try {
    inferredData = await InferData.fromPluginJar(await primaryFile.read());
}
catch (e) {
    core.setFailed(e as any);
    process.exit(1);
}

core.debug("inferred: " + JSON.stringify(inferredData));

if (inferredData === null) {
    core.setFailed("Could not infer data from plugin jar");
    process.exit(1);
}

const res = await new ModrinthCreateVersion(inputs.token, [primaryFile], {
    name: inferredData.name,
    version_number: inferredData.version,
    changelog: inputs.changelog,
    dependencies: [],
    game_versions: inferredData.gameVersions,
    version_type: inferredData.version.includes("alpha") ? "alpha" : inferredData.version.includes("beta") || inferredData.version.match(/[^A-z](rc)[^A-z]/) || inferredData.version.match(/[^A-z](pre)[^A-z]/) ? "beta" : "release",
    loaders: inputs.loaders,
    featured: false,
    project_id: inputs.project
}).send();
core.debug(`Modrinth API\nstatus: ${res.status}\nheaders: ${JSON.stringify(res.headers.entries())}`);

const data = await res.text();
core.debug(`Modrinth API\nbody: ${data}`);

let json;
try {
    json = JSON.parse(data);
    core.setOutput("version-id", json.id);
    core.setOutput("version-url", `https://modrinth.com/project/${inputs.project}/version/${json.id}`);
}
catch (e) {
    core.warning(`Failed to parse Modrinth response body: ${e}`);
}
process.exit();
