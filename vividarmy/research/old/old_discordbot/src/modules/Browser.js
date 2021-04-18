const http = require('http');
const https = require('https');
const SocksProxyAgent = require('socks-proxy-agent');

const TRANSPORT_BY_PROTOCOL = {
    'http:': http.request,
    'https:': https.request,
};

const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_ENCODING = 'utf-8';

const REQUEST_HEADER_COOKIE = 'Cookie';
const REQUEST_HEADER_USER_AGENT = 'User-Agent';
const REQUEST_HEADER_REFERER = 'Referer';
const REQUEST_HEADER_ACCEPT = 'Accept';
const REQUEST_HEADER_ACCEPT_LANGUAGE = 'Accept-Language';
const REQUEST_HEADER_DNT = 'Dnt';

const RESPONSE_NORMALIZED_HEADER_COOKIE = 'set-cookie';

class Browser {
    constructor(conf) {
        Object.assign(this, conf);

        this.requestTimeoutMs = this.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;

        if (this.socks5) {
            this.agent = new SocksProxyAgent(this.socks5);
        }
    }

    get(url, options = {}) {
        options.method = 'GET';

        return this.request(url, options);
    }

    request(url, options = {}) {
        return new Promise((resolve, reject) => {
            url = new URL(url);

            if (url.search.match(/=:[^:&\?]+:/i)) {
                throw Error(`url contains template: ${url}`);
            }

            const transport = TRANSPORT_BY_PROTOCOL[url.protocol];

            options.agent = options.agent || this.agent || false;
            options.timeout = options.timeout || this.requestTimeoutMs;

            options.headers = options.headers || {};

            if (this.userAgent) {
                options.headers[REQUEST_HEADER_USER_AGENT] = options.headers[REQUEST_HEADER_USER_AGENT] || this.userAgent;
            }

            if (options.referer) {
                options.headers[REQUEST_HEADER_REFERER] = options.headers[REQUEST_HEADER_REFERER] || options.referer;
            }

            options.headers[REQUEST_HEADER_ACCEPT] = options.headers[REQUEST_HEADER_ACCEPT] || '*/*';
            options.headers[REQUEST_HEADER_ACCEPT_LANGUAGE] = options.headers[REQUEST_HEADER_ACCEPT_LANGUAGE] || 'en-US,en;q=0.9';
            options.headers[REQUEST_HEADER_DNT] = options.headers[REQUEST_HEADER_DNT] || '1';

            if (this.cookieJar) {
                const cookiesFromJar = this.cookieJar.get(url.host, new Date);

                if (cookiesFromJar) {
                    const cookiesFromOptions = options.headers[REQUEST_HEADER_COOKIE];

                    options.headers[REQUEST_HEADER_COOKIE] = cookiesFromOptions ?
                        cookiesFromOptions + '; ' + cookiesFromJar :
                        cookiesFromJar;
                }
            }

            const request = transport(url, options, (response) => {
                response.setEncoding(DEFAULT_ENCODING);

                const body = [];

                response.on('data', (chunk) => {
                    body.push(chunk);
                });

                response.on('end', () => {
                    const result = {
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                        headers: response.headers,
                        body: body.join(''),
                    };

                    if (this.cookieJar) {
                        this.cookieJar.put(
                            request.host,
                            response.headers[RESPONSE_NORMALIZED_HEADER_COOKIE],
                        ).then(() => resolve(result)).catch(reject);
                    } else {
                        resolve(result);
                    }
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            // request.write(postData);

            request.end();
        });
    }
}

module.exports = Browser;
