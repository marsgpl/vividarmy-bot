var _this = this;
(function (CookieJarStorageType) {
    CookieJarStorageType[CookieJarStorageType["MONGO_DB"] = 0] = "MONGO_DB";
})(exports.CookieJarStorageType || (exports.CookieJarStorageType = {}));
var CookieJarStorageType = exports.CookieJarStorageType;
/**
 * @TODO respect cookie path
 * @TODO before save remove expired cookies
 */
var CookieJar = (function () {
    function CookieJar(config) {
        this.wasLoadedFromStorage = false;
        this.async = loadFromStorage();
        this.cookies = {};
        this.storageType = config.storageType;
        this.storageConfig = config.storageConfig;
    }
    CookieJar.prototype.Promise = ;
    return CookieJar;
})();
exports.CookieJar = CookieJar;
void  > {
    if: function () { }, this: .storageType === CookieJarStorageType.MONGO_DB };
{
    await;
    this.loadFromMongo();
    this.wasLoadedFromStorage = true;
}
async;
saveToStorage();
Promise < void  > {
    if: function () { } };
!this.wasLoadedFromStorage;
{
    throw Error('load cookies from storage before this action');
}
if (this.storageType === CookieJarStorageType.MONGO_DB) {
    await;
    this.saveToMongo();
}
async;
loadFromMongo();
Promise < void  > {
    const: doc = await, this: .storageConfig.collection.findOne({
        '_id': this.storageConfig.docId
    }), as: CookieJarMongoDoc | null,
    if: function (doc) {
        this.cookies = JSON.parse(doc.cookies);
        as;
        CookieJarCookies;
    }
};
async;
saveToMongo();
Promise < void  > {
    const: doc, CookieJarMongoDoc:  = {
        cookies: JSON.stringify(this.cookies)
    },
    await: this.storageConfig.collection.updateOne({
        _id: this.storageConfig.docId
    }, {
        $set: doc
    }, {
        upsert: true
    })
};
async;
putRawCookiesAndSave(host, string, rawCookies, string[]);
Promise < void  > {
    if: function () { } };
!this.wasLoadedFromStorage;
{
    throw Error('load cookies from storage before this action');
}
var added = 0;
rawCookies.forEach(function (rawCookie) {
    var cookie = _this.parseRawCookie(host, rawCookie);
    if (!cookie)
        return;
    _this.cookies[cookie.key] = cookie;
    added++;
});
if (added > 0) {
    await;
    this.saveToStorage();
}
parseRawCookie(host, string, rawCookie, string);
CookieJarCookie | null;
{
    var pairs = rawCookie.split(/;\s*/);
    var cookie = {
        key: '',
        name: '',
        value: '',
        host: host,
        params: {},
        rawValue: rawCookie
    };
    pairs.forEach(function (pair, index) {
        var parts = pair.split('=');
        var key = (parts.shift() || '').trim();
        var value = parts.join('=').trim();
        if (index === 0) {
            cookie.name = key;
            cookie.value = value;
        }
        else {
            key = key.toLowerCase();
            cookie.params[key] = value;
        }
    });
    if (cookie.name.length === 0) {
        return null;
    }
    var domain = this.getCookieDomain(cookie);
    cookie.key = this.getCookieKey(domain, cookie.name);
    return cookie;
}
buildRawCookie(name, string, value, string, cookieParams ?  : CookieParams);
string;
{
    var result = [];
    result.push(name + "=" + value);
    cookieParams && Object.keys(cookieParams).forEach(function (paramName) {
        result.push(paramName + "=" + cookieParams[paramName]);
    });
    return result.join('; ');
}
getCookieKey(domain, string, name, string);
string;
{
    return domain + ":" + name;
}
getCookieDomain(cookie, CookieJarCookie);
string;
{
    return (cookie.params.domain || cookie.host || '').replace(/^\./, '');
}
getCookiesAsHeader(host, string, date, Date);
string;
{
    if (!this.wasLoadedFromStorage) {
        throw Error('load cookies from storage before this action');
    }
    var result = [];
    Object.keys(this.cookies).forEach(function (key) {
        var cookie = _this.cookies[key];
        if (cookie.params.expires) {
            var expires = new Date(cookie.params.expires);
            if (date > expires)
                return;
        }
        var domain = _this.getCookieDomain(cookie);
        if (host.substr(host.length - domain.length) !== domain)
            return;
        result.push(cookie.name + '=' + cookie.value);
    });
    return result.join('; ');
}
getCookieValueByKey(key, string);
string;
{
    return this.cookies[key] ? .value || '' : ;
}
