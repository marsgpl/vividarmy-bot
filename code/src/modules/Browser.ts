import http, { RequestOptions, IncomingMessage, Agent, IncomingHttpHeaders } from 'http';
import https from 'https';
import { SocksProxyAgent } from 'socks-proxy-agent';

import { CookieJar } from 'modules/CookieJar';
import safe from 'helpers/safe';

const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_ENCODING = 'utf-8';

const REQUEST_HEADER_COOKIE = 'Cookie';
const REQUEST_HEADER_USER_AGENT = 'User-Agent';
const REQUEST_HEADER_REFERER = 'Referer';
const REQUEST_HEADER_ORIGIN = 'Origin';
const REQUEST_HEADER_ACCEPT = 'Accept';
const REQUEST_HEADER_ACCEPT_LANGUAGE = 'Accept-Language';
const REQUEST_HEADER_DNT = 'Dnt';
const REQUEST_HEADER_CONTENT_LENGTH = 'Content-Length';
const REQUEST_HEADER_CONTENT_TYPE = 'Content-Type';

const RESPONSE_NORMALIZED_HEADER_COOKIE = 'set-cookie';

export interface BrowserConfig {
    userAgent?: string;
    cookieJar?: CookieJar;
    requestTimeoutMs?: number;
    socks5?: {
        host: string;
        port: number;
    };
}

export interface BrowserRequestCustomOptions {
    referer?: string;
    origin?: string;
    postData?: string;
    contentType?: string;
}

export interface BrowserResponse {
    statusCode: number;
    statusMessage: string;
    headers: IncomingHttpHeaders;
    body: string;
}

export class Browser {
    protected config: BrowserConfig;
    protected agent?: SocksProxyAgent;

    constructor(config: BrowserConfig) {
        this.config = config;

        if (config.socks5) {
            this.agent = new SocksProxyAgent(config.socks5);
        }
    }

    setCookieJar(cookieJar: CookieJar): void {
        this.config.cookieJar = cookieJar;
    }

    get(
        url: string | URL,
        options: RequestOptions = {},
        customOptions: BrowserRequestCustomOptions = {},
    ): Promise<BrowserResponse> {
        options.method = 'GET';
        return this.request(url, options, customOptions);
    }

    post(
        url: string | URL,
        options: RequestOptions = {},
        customOptions: BrowserRequestCustomOptions = {},
    ): Promise<BrowserResponse> {
        options.method = 'POST';
        return this.request(url, options, customOptions);
    }

    request(
        rawUrl: string | URL,
        options: RequestOptions = {},
        customOptions: BrowserRequestCustomOptions = {},
    ): Promise<BrowserResponse> {
        return new Promise((resolve, reject) => {
            const { config } = this;

            if (options.method !== 'GET' && options.method !== 'POST') {
                throw Error('Browser currently supports only GET and POST methods');
            }

            const url = typeof rawUrl === 'string' ? new URL(rawUrl) : rawUrl;

            if (url.search.match(/=:[^:&\?]+:/i)) {
                throw Error(`url contains template: ${url}`);
            }

            options.agent = options.agent || this.agent as unknown as Agent || false;
            options.timeout = options.timeout || config.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
            options.headers = options.headers || {};

            if (config.userAgent) {
                options.headers[REQUEST_HEADER_USER_AGENT] =
                    options.headers[REQUEST_HEADER_USER_AGENT] || config.userAgent;
            }

            if (customOptions.referer) {
                options.headers[REQUEST_HEADER_REFERER] =
                    options.headers[REQUEST_HEADER_REFERER] || customOptions.referer;
            }

            if (customOptions.origin) {
                options.headers[REQUEST_HEADER_ORIGIN] =
                    options.headers[REQUEST_HEADER_ORIGIN] || customOptions.origin;
            }

            options.headers[REQUEST_HEADER_ACCEPT] =
                options.headers[REQUEST_HEADER_ACCEPT] || '*/*';
            options.headers[REQUEST_HEADER_ACCEPT_LANGUAGE] =
                options.headers[REQUEST_HEADER_ACCEPT_LANGUAGE] || 'en-US,en;q=0.9';
            options.headers[REQUEST_HEADER_DNT] =
                options.headers[REQUEST_HEADER_DNT] || '1';

            if (customOptions.contentType) {
                options.headers[REQUEST_HEADER_CONTENT_TYPE] =
                    customOptions.contentType;
            }

            if (config.cookieJar) {
                const cookiesFromJar = config.cookieJar.getCookiesAsHeader(url.host, new Date);

                if (cookiesFromJar) {
                    const cookiesFromOptions = options.headers[REQUEST_HEADER_COOKIE];

                    options.headers[REQUEST_HEADER_COOKIE] = cookiesFromOptions ?
                        cookiesFromOptions + '; ' + cookiesFromJar :
                        cookiesFromJar;
                }
            }

            if (options.method === 'POST') {
                options.headers[REQUEST_HEADER_CONTENT_LENGTH] =
                    Buffer.byteLength(customOptions.postData || '', 'utf8');

                console.log(safe(`>> POST: ${rawUrl}`));
                console.log(safe(`>> POST headers: ${JSON.stringify(options.headers)}`));
            }

            const onResponse = (response: IncomingMessage): void => {
                response.setEncoding(DEFAULT_ENCODING);

                const body: string[] = [];

                response.on('data', (chunk) => {
                    body.push(chunk);
                });

                response.on('end', () => {
                    const result: BrowserResponse = {
                        statusCode: response.statusCode || 0,
                        statusMessage: response.statusMessage || '',
                        headers: response.headers,
                        body: body.join(''),
                    };

                    if (config.cookieJar) {
                        config.cookieJar.putRawCookiesAndSave(
                            url.hostname,
                            response.headers[RESPONSE_NORMALIZED_HEADER_COOKIE] || [],
                        ).then(() => resolve(result)).catch(reject);
                    } else {
                        resolve(result);
                    }
                });
            };

            const request = url.protocol === 'https:' ?
                https.request(url, options, onResponse) :
                http.request(url, options, onResponse);

            request.on('error', (error) => {
                reject(error);
            });

            request.on('timeout', () => {
                reject('timeout');
            });

            if (customOptions.postData) {
                request.write(customOptions.postData);

                console.log(safe(`>> POST data: ${customOptions.postData}`));
            }

            request.end();
        });
    }
}
