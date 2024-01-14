import crypto from "node:crypto";
import * as core from "@actions/core";
import ModrinthRequest from "./ModrinthRequest.js";
import Multipart from "./Multipart.js";
import FilePointer from "./FilePointer.js";

export default class ModrinthCreateVersion extends ModrinthRequest {
    public static apiDomain = core.getInput("api-domain", {required: false});
    private readonly boundary: string;
    public constructor(public readonly token: string, public readonly files: FilePointer[], public readonly options: {
        /**
         * The name of this version
         */
        name: string;

        /**
         * The version number. Ideally will follow semantic versioning
         */
        version_number: string;

        /**
         * The changelog for this version
         */
        changelog?: string;

        /**
         * A list of specific versions of projects that this version depends on
         */
        dependencies: {version_id?: string, project_id?: string, file_name?: string, dependency_type: "required" | "optional" | "incompatible" | "embedded"}[] | readonly [];

        /**
         * A list of versions of Minecraft that this version supports
         */
        game_versions: string[];

        /**
         * The release channel for this version
         */
        version_type: "release" | "beta" | "alpha";

        /**
         * The mod loaders that this version supports
         */
        loaders: string[];

        /**
         * Whether the version is featured or not
         */
        featured: boolean;

        status?: "listed" | "archived" | "draft" | "unlisted" | "scheduled" | "unknown";
        requested_status?: "listed" | "archived" | "draft" | "unlisted";

        /**
         * The ID of the project this version is for
         */
        project_id: string;
    }) {
        if (files.length === 0) throw new RangeError("No files provided");
        const boundary = crypto.randomUUID();
        super(`https://${ModrinthCreateVersion.apiDomain}/v2/version`, {
            "User-Agent": "github.com/cloudnode-pro/modrinth-publish",
            Authorization: token,
            "Content-Type": `multipart/form-data; boundary=${boundary}`
        }, undefined, "POST");
        this.boundary = boundary;
    }

    public override async send(): Promise<Response> {
        const primaryFile = this.files[0]!;
        this.body = new Multipart(this.boundary,
            new Multipart.Part({
                "Content-Disposition": 'form-data; name="data"',
            }, JSON.stringify({
                ...this.options,
                file_parts: [primaryFile.name + "-primary", ...this.files.slice(1).map(file => file.name)],
                primary_file: primaryFile.name + "-primary",
            })),
            new Multipart.Part({
                "Content-Disposition": `form-data; name="${primaryFile.name}-primary"; filename="${primaryFile.name}"`,
                "Content-Type": "application/octet-stream",
            }, await primaryFile.read()),
            ...await Promise.all(this.files.slice(1).map(async file => new Multipart.Part({
                "Content-Disposition": `form-data; name="${file.name}"; filename="${file.name}"`,
                "Content-Type": "application/octet-stream",
            }, await file.read()))),
        ).toBuffer();
        return await super.send();
    }
}
