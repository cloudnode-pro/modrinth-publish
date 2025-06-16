export class VersionsManifest {
    public static MOJANG_VERSIONS_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

    public constructor(public readonly versions: string[]) {
    }

    static async fetch() {
        const res = await fetch(VersionsManifest.MOJANG_VERSIONS_MANIFEST_URL);
        if (!res.ok) throw new Error("Failed to load Mojang versions manifest: "
            + res.status + res.statusText !== "" ? ` (${res.statusText})` : "");
        const json: {versions: {id: string, type: string}[]} = await res.json();
        return new VersionsManifest(json.versions
            .filter(v => v.type === "release")
            .map(v => v.id));
    }
}
