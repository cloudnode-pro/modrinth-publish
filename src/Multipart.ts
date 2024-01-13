class Multipart {
    public readonly parts: Multipart.Part[];
    public constructor(boundary: string, ...parts: Multipart.Part[]);
    public constructor(boundary: string, parts: Multipart.Part[]);
    /** @internal */
    public constructor(public readonly boundary: string, ...parts: (Multipart.Part | Multipart.Part[])[]) {
        this.parts = parts.flat();
    }


    public toBuffer(): Buffer {
        const data: Buffer[] = [];
        for (const part of this.parts) {
            data.push(Buffer.from("--" + this.boundary + "\r\n"));
            data.push(part.toBuffer());
        }
        data.push(Buffer.from("--" + this.boundary + "--\r\n"));
        return Buffer.concat(data);
    }
}

namespace Multipart {
    export class Part {
        public constructor(public readonly headers: Record<string, string>, public readonly body: string | Buffer) {}

        public toBuffer(): Buffer {
            const data: Buffer[] = [];
            for (const [header, value] of Object.entries(this.headers))
                data.push(Buffer.from(header + ": " + value + "\r\n"));
            data.push(Buffer.from("\r\n"));
            data.push(this.body instanceof Buffer ? this.body : Buffer.from(this.body));
            data.push(Buffer.from("\r\n"));
            return Buffer.concat(data);
        }
    }
}

export default Multipart;
