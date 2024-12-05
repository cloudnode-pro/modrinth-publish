export default class ModrinthRequest {
    public readonly headers: Headers;

    /**
     * Create a request to the modrinth API
     *
     * @param url The full url to send the request to
     * @param [headers] Initial request headers (can be modified prior to sending)
     * @param [body] Request body
     * @param [method] Request method
     */
    public constructor(public readonly url: string, headers?: HeadersInit, public body?: BodyInit | null, public method: string = "GET") {
        this.headers = new Headers(headers);
    }

    /**
     * Send the request
     */
    public async send(): Promise<Response> {
        const options: RequestInit = {
            headers: this.headers,
            method: this.method
        }
        if (this.body) options.body = this.body
        return await fetch(this.url, options);
    }
}
