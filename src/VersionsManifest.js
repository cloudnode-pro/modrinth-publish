export class VersionsManifest {
    static MOJANG_VERSIONS_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

    constructor(versions) {
        this.versions = versions;
    }

    static async fetch() {
        const res = await fetch(VersionsManifest.MOJANG_VERSIONS_MANIFEST_URL);
        if (!res.ok) throw new Error("Failed to load Mojang versions manifest: " + res.status);
        const json = await res.json();
        return new VersionsManifest(json.versions
            .filter(v => v.type === "release")
            .map(v => v.id));
    }
}
