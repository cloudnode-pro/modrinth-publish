import * as core from "@actions/core";
import {Multipart} from "multipart-ts";
import ModrinthRequest from "./ModrinthRequest.js";
import FilePointer from "./FilePointer.js";

export default class ModrinthCreateVersion extends ModrinthRequest {
    public static apiDomain = core.getInput("api-domain", {required: false});
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
        super(`https://${ModrinthCreateVersion.apiDomain}/v2/version`, {
            "User-Agent": "github.com/cloudnode-pro/modrinth-publish",
            Authorization: token,
        }, undefined, "POST");
    }

    public override async send(): Promise<Response> {
        const primaryFile = this.files[0]!;
        const formData = new FormData();
        formData.set("data", JSON.stringify({
            ...this.options,
            file_parts: [primaryFile.name + "-primary", ...this.files.slice(1).map(file => file.name)],
            primary_file: primaryFile.name + "-primary",
        }));
        formData.set(primaryFile.name + "-primary", new File([await primaryFile.read()], primaryFile.name));
        for (const file of this.files.slice(1))
            formData.set(file.name, new File([await file.read()], file.name));
        const multipart = await Multipart.formData(formData);
        this.headers.set("Content-Type", multipart.headers.get("Content-Type")!);
        this.body = multipart.body;
        return await super.send();
    }
}
