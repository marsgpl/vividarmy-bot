var http_1 = require('http');
var https_1 = require('https');
var socks_proxy_agent_1 = require('socks-proxy-agent');
var DEFAULT_REQUEST_TIMEOUT_MS = 10000;
var DEFAULT_ENCODING = 'utf-8';
var REQUEST_HEADER_COOKIE = 'Cookie';
var REQUEST_HEADER_USER_AGENT = 'User-Agent';
var REQUEST_HEADER_REFERER = 'Referer';
var REQUEST_HEADER_ORIGIN = 'Origin';
var REQUEST_HEADER_ACCEPT = 'Accept';
var REQUEST_HEADER_ACCEPT_LANGUAGE = 'Accept-Language';
var REQUEST_HEADER_DNT = 'Dnt';
var RESPONSE_NORMALIZED_HEADER_COOKIE = 'set-cookie';
var Browser = (function () {
    function Browser(config) {
        this.config = config;
        if (config.socks5) {
            this.agent = new socks_proxy_agent_1.SocksProxyAgent(config.socks5);
        }
    }
    Browser.prototype.setCookieJar = function (cookieJar) {
        this.config.cookieJar = cookieJar;
    };
    Browser.prototype.get = function (url, options, customOptions) {
        if (options === void 0) { options = {}; }
        if (customOptions === void 0) { customOptions = {}; }
        options.method = 'GET';
        return this.request(url, options, customOptions);
    };
    Browser.prototype.request = function (rawUrl, options, customOptions) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (customOptions === void 0) { customOptions = {}; }
        return new Promise(function (resolve, reject) {
            var config = _this.config;
            if (options.method !== 'GET') {
                throw Error('Browser currently supports only GET method');
            }
            var url = typeof rawUrl === 'string' ? new URL(rawUrl) : rawUrl;
            if (url.search.match(/=:[^:&\?]+:/i)) {
                throw Error("url contains template: " + url);
            }
            options.agent = options.agent || _this.agent;
            as;
            unknown;
            as;
            http_1.Agent || false;
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
            if (config.cookieJar) {
                var cookiesFromJar = config.cookieJar.getCookiesAsHeader(url.host, new Date);
                if (cookiesFromJar) {
                    var cookiesFromOptions = options.headers[REQUEST_HEADER_COOKIE];
                    options.headers[REQUEST_HEADER_COOKIE] = cookiesFromOptions ?
                        cookiesFromOptions + '; ' + cookiesFromJar :
                        cookiesFromJar;
                }
            }
            var onResponse = function (response) {
                response.setEncoding(DEFAULT_ENCODING);
                var body = [];
                response.on('data', function (chunk) {
                    body.push(chunk);
                });
                response.on('end', function () {
                    var result = {
                        statusCode: response.statusCode || 0,
                        statusMessage: response.statusMessage || '',
                        headers: response.headers,
                        body: body.join('')
                    };
                    if (config.cookieJar) {
                        config.cookieJar.putRawCookiesAndSave(url.hostname, response.headers[RESPONSE_NORMALIZED_HEADER_COOKIE] || []).then(function () { return resolve(result); }).catch(reject);
                    }
                    else {
                        resolve(result);
                    }
                });
            };
            var request = url.protocol === 'https:' ?
                https_1["default"].request(url, options, onResponse) :
                http_1["default"].request(url, options, onResponse);
            request.on('error', function (error) {
                reject(error);
            });
            request.on('timeout', function () {
                reject('timeout');
            });
            /**
             * @TODO POST
             */
            // request.write(postData);
            request.end();
        });
    };
    return Browser;
})();
exports.Browser = Browser;
