var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseBot_1 = require('./BaseBot');
var Web = (function (_super) {
    __extends(Web, _super);
    function Web(config) {
        _super.call(this, 'Web', config);
        this.async = start();
    }
    Object.defineProperty(Web.prototype, "state", {
        get: function () {
            if (!this._state)
                throw Error('Web: no state');
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Web.prototype.Promise = ;
    return Web;
})(BaseBot_1.BaseBot);
exports.Web = Web;
void  > {};
