import fs from "node:fs/promises";
import path from "node:path";

export default class FilePointer {
    public constructor(public readonly path: string) {}

    public async read(): Promise<Buffer> {
        return await fs.readFile(this.path);
    }

    public get name(): string {
        return path.basename(this.path);
    }
}
