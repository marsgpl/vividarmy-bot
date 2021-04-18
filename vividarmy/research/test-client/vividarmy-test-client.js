const https = require('https');
const WebSocket = require('ws');
const SocksProxyAgent = require('socks-proxy-agent');

const b64e = function(str) {
    return Buffer.from(str).toString('base64');
};

const IPCC_URL = 'https://eki.one/ipcc';

const agent = new SocksProxyAgent({
    host: '127.0.0.1',
    port: 19254,
});

// https.get(IPCC_URL, { agent }, (res) => {
//     res.pipe(process.stdout);
// });

const WSS_URL = 'wss://knight-cn-tencent-520.rivergame.net/s655';

const ws = new WebSocket(WSS_URL, { agent });

ws.on('open', () => {
    const token = 'h4GmCZfIdIHn3mLwBTsZaLPu4xtk8heRzvqcL5MSgkHGoBMF5ZiSgdVZrf5F6Mlr';
    const serverInfoToken = b64e(`655,g123,GGC5O711,wss://knight-cn-tencent-520.rivergame.net/s655,1600283813386,67591184b9a95cfc89f5847f46433a4a,,`);

    ws.send(`{"c":1,"o":"0","p":{"aliSAFData":{"hash":"T2gAWg33w63hmT62TSyogLxoA1k1v5REiET4KOdD23n1Gu0Znv7oW84R5nwcnG-OA-FXRN4giXLOz5F0hSz5Hre9","detail":"137#3FE9hE9o97FpQR2xscJNXm9WIr9C5DobLiqMaUJU9twushTXT2+6+n5anuCJqY65hVPoiDAtlbgHcOxMg3H0fiGZr2LvfweqIeaHRfL6Rz1oY3ZM7L21nHs6eMAutnnugO5Q/Vrq8gri3Umd7tkvg3lcayD6nyuX0owBcVKSwIIMhK3P6MNqRYonNGKF9f7MAGu9+m0ip90pwX9zQvkPrc2mCRK6CEaWxmnyTNA/jDZFT2MzjciKRyQ/EylwbVN+PXjdMF+FcR6pQ55yG5qvxsNZDmOiZBmrxiqmQofJ+GXppRJE1Aey+tppYSUS1lQypXiwQonoBf6b5nVc1IBi+piVYSUx1lLTosFzQoLOvpPSzRFAEQwy+tyDYHVShZQipXpcQefx+GXppRJc16ci+ppVYSUx1lgippimQofJBEjrbmpX9+VUzJZHsc8/jHwrwLd6qztynPpM+ECYINMhvHBzeh9p2JL8vr+U7Vi9oGiLlrHOpjzfv1+1Gow/L9XIWrNTFPIGtd13T2WVTnF90i9Bs5XO6q2OSh9VwRAN7oO2QXTV1bPaenSrgnAIUQs5ZH939NWJ2cgl/5jolw+eGDziz5sYRK5TMd8a08VJTQkBqfo1UEq5M0EWDiv1uhMwur37KK9C3Ew1aFr4r4xOuVvNGo3nkTifUm+UtD+xCjv1ZKTTZMifrl5W5nAQb77IoD7R6oZxwSGi5sYOIwI7EHVj1gB4msZobhPgsUhNbETXoGzfMuRlBnxXQ6Ox0UsbbxNVsrEG6enEeW41upBfvTb2Jodwc4FJAtHcgffe2/b5Zjdd0zxOhB9O6SaL6Zd5kY5d4O8muSXGVpMTQDQ+mjo=","fphash":"5746fe97a90475efb3cbf29ad2a74588"},"token":"${token}","country":"JP","lang":"ja","nationalFlag":114,"ip":"0","pf":"g123","platform":"G123","channel":"g123_undefined","platformVer":"1.119.1","serverId":655,"serverInfoToken":"${serverInfoToken}","appVersion":"1.119.1","gaid":"","itemId":"","g123test":0}}`);
});

ws.on('message', function incoming(data) {
    console.log('🔸 data:', data);
});

setTimeout(() => {
    process.exit(1);
}, 20000);
