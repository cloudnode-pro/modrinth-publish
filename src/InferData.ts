import yaml from "js-yaml";
import JSZip from "jszip";

export default class InferData {
    public static mojangVersionManifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

    public static async getMojangApiGameVersions(): Promise<{ id: string, type: "release" | "snapshot" }[]> {
        const res = await fetch(InferData.mojangVersionManifestUrl);
        const json = await res.json();
        return json.versions;
    }

    private constructor(public readonly name: string, public readonly version: string, public readonly gameVersions: string[]) {}

    public static fromPluginMetaFile = {
        async "plugin.yml"(data: string) {
            const metadata = yaml.load(data) as any;
            const gameVersions = await InferData.getMojangApiGameVersions();
            return new InferData(`${metadata.name} ${metadata.version}`, metadata.version, gameVersions.filter(v => v.id.startsWith(metadata["api-version"]) && v.type === "release").map(v => v.id));
        },
        async "paper-plugin.yml"(data: string) {
            return await InferData.fromPluginMetaFile["plugin.yml"](data);
        },
        async "bungee.yml"(data: string) {
            const metadata = yaml.load(data) as any;
            return new InferData(`${metadata.name} ${metadata.version}`, metadata.version, []);
        },
        async "velocity-plugin.json"(data: string) {
            const metadata = JSON.parse(data);
            return new InferData(`${metadata.name} ${metadata.version}`, metadata.version, []);
        }
    } as const;

    public static async fromPluginJar(data: Buffer): Promise<InferData | null> {
        const zipReader = new JSZip();

        const zip = await zipReader.loadAsync(data);

        for (const fileName in InferData.fromPluginMetaFile) {
            const file = zip.file(fileName);

            if (file !== null) {
                const text = await file.async("string");
                return await InferData.fromPluginMetaFile[fileName as keyof typeof InferData.fromPluginMetaFile](text);
            }
        }
        return null;
    }
}
