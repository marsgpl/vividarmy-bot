// QQPlay window need to be inited first
if (false) {
    BK.Script.loadlib('GameRes://libs/qqplay-adapter.js');
}
if(Number.parseFloat===undefined) Number.parseFloat=window.parseFloat
if(Number.parseInt===undefined) Number.parseInt=window.parseInt
if(Number.isNaN===undefined) Number.isNaN=window.isNaN

if (!Object.values) 
{
    Object.values = function(obj) 
    {
        if (obj !== Object(obj))
            throw new TypeError('Object.values called on a non-object');
        var val=[],key;
        for (key in obj) 
        {
            if (Object.prototype.hasOwnProperty.call(obj,key)) 
            {
                val.push(obj[key]);
            }
        }
        return val;
    }
}

if (!Array.prototype.fill) {
    Object.defineProperty(Array.prototype, 'fill', {
        value: function(value) {
    
          // Steps 1-2.
          if (this == null) {
            throw new TypeError('this is null or not defined');
          }
    
          var O = Object(this);
    
          // Steps 3-5.
          var len = O.length >>> 0;
    
          // Steps 6-7.
          var start = arguments[1];
          var relativeStart = start >> 0;
    
          // Step 8.
          var k = relativeStart < 0 ?
            Math.max(len + relativeStart, 0) :
            Math.min(relativeStart, len);
    
          // Steps 9-10.
          var end = arguments[2];
          var relativeEnd = end === undefined ?
            len : end >> 0;
    
          // Step 11.
          var final = relativeEnd < 0 ?
            Math.max(len + relativeEnd, 0) :
            Math.min(relativeEnd, len);
    
          // Step 12.
          while (k < final) {
            O[k] = value;
            k++;
          }
    
          // Step 13.
          return O;
        }
      });
      Object.defineProperty(Float32Array.prototype, 'fill', {
        value: function(value) {
    
          // Steps 1-2.
          if (this == null) {
            throw new TypeError('this is null or not defined');
          }
    
          var O = Object(this);
    
          // Steps 3-5.
          var len = O.length >>> 0;
    
          // Steps 6-7.
          var start = arguments[1];
          var relativeStart = start >> 0;
    
          // Step 8.
          var k = relativeStart < 0 ?
            Math.max(len + relativeStart, 0) :
            Math.min(relativeStart, len);
    
          // Steps 9-10.
          var end = arguments[2];
          var relativeEnd = end === undefined ?
            len : end >> 0;
    
          // Step 11.
          var final = relativeEnd < 0 ?
            Math.max(len + relativeEnd, 0) :
            Math.min(relativeEnd, len);
    
          // Step 12.
          while (k < final) {
            O[k] = value;
            k++;
          }
    
          // Step 13.
          return O;
        }
      });
  }

Object.assign || Object.defineProperty(Object, "assign", {
    enumerable: !1,
    configurable: !0,
    writable: !0,
    value: function n(r, e) {
        if (void 0 === r || null === r) throw new TypeError("Cannot convert first argument to object");
        for (var t = Object(r), n = 1; n < arguments.length; n++) {
            var o = arguments[n];
            if (void 0 !== o && null !== o)
                for (var i = Object.keys(Object(o)), u = 0, f = i.length; u < f; u++) {
                    var c = i[u],
                        a = Object.getOwnPropertyDescriptor(o, c);
                    void 0 !== a && a.enumerable && (t[c] = o[c])
                }
        }
        return t
    }
})
window.showAlertPop = function () 
{
    // let link = document.createElement('link');
    // link.type = 'text/css';
    // link.rel = 'stylesheet';
    // link.href = "https://knight-g123.akamaized.net/vividres/tip_style.css";
    // let head = document.getElementsByTagName('head')[0];
    // head.appendChild(link);
    // let model = document.createElement('div');
    // model.className="modal";
    // model.style.display="block"
    // document.lastChild.appendChild(model);
    // let dialog = document.createElement('div');
    // dialog.className="modal-content";
    // let closeBtn = document.createElement('span');
    // closeBtn.className="close";
    // closeBtn.innerHTML="&times;";
    // dialog.appendChild(closeBtn);
    // closeBtn.onclick = function() {
    //     model.style.display = "none";
    // }
    // window.onclick = function(event) {
    //     if (event.target == model) {
    //         model.style.display = "none";
    //     }
    // }
    // let desc = "このブラウザではcookieの使用が制限されています。";
    // let content = document.createElement('span');
    // content.innerHTML=desc;
    // dialog.appendChild(content);
    // let imgtp = document.createElement('img');
    // imgtp.src= "https://knight-g123.akamaized.net/vividres/emoji_01.png";//base64数据 
    // imgtp.style.position="absolute"
    // imgtp.width=60;
    // imgtp.style.margin="-20px 0px 0px 0px";
    // dialog.appendChild(imgtp);

    // let desc3 = "<br>この状態ではゲームデータの保存ができず、更新しても現在のアカウントを取得できない可能性があります。";
    // let content3 = document.createElement('span');
    // content3.innerHTML=desc3;
    // dialog.appendChild(content3);

    // let desc2 = "<br><br>cookieの制限を解除すると、より快適にビビッドアーミーを遊ぶことができます。";
    // let content2 = document.createElement('span');
    // content2.innerHTML=desc2;
    // dialog.appendChild(content2);
    // let imgtp2 = document.createElement('img');
    // imgtp2.src= "https://knight-g123.akamaized.net/vividres/emoji_02.png";; //base64数据 
    // imgtp2.style.position="absolute"
    // imgtp2.width=60;
    // imgtp2.style.margin="-20px 0px 0px 0px";
    // dialog.appendChild(imgtp2);
    
    // model.appendChild(dialog);

    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = "https://knight-g123.akamaized.net/vividres/tip_style.css";
    let head = document.getElementsByTagName('head')[0];
    head.appendChild(link);
    let model = document.createElement('div');
    model.className="modal";
    model.style.display="block"
    document.lastChild.appendChild(model);
    let dialog = document.createElement('div');
    dialog.className="modal-content";
    let closeBtn = document.createElement('span');
    closeBtn.className="close";
    closeBtn.innerHTML="&times;";
    dialog.appendChild(closeBtn);
    closeBtn.onclick = function() {
        model.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == model) {
            model.style.display = "none";
        }
    }
    let desc3 = "<br>システムがブラウザのcookieの使用制限を検知しました。<br>この状態ではゲームデータの保存ができず、更新しても現在のアカウントを取得できない可能性があります。<br><br>";
    let content3 = document.createElement('span');
    content3.innerHTML=desc3;
    dialog.appendChild(content3);
    
    model.appendChild(dialog);
}
window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;

    if ( !settings.debug ) {
        var uuids = settings.uuids;

        var rawAssets = settings.rawAssets;
        var assetTypes = settings.assetTypes;
        var realRawAssets = settings.rawAssets = {};
        for (var mount in rawAssets) {
            var entries = rawAssets[mount];
            var realEntries = realRawAssets[mount] = {};
            for (var id in entries) {
                var entry = entries[id];
                var type = entry[1];
                // retrieve minified raw asset
                if (typeof type === 'number') {
                    entry[1] = assetTypes[type];
                }
                // retrieve uuid
                realEntries[uuids[id] || id] = entry;
            }
        }

        var scenes = settings.scenes;
        for (var i = 0; i < scenes.length; ++i) {
            var scene = scenes[i];
            if (typeof scene.uuid === 'number') {
                scene.uuid = uuids[scene.uuid];
            }
        }

        var packedAssets = settings.packedAssets;
        for (var packId in packedAssets) {
            var packedIds = packedAssets[packId];
            for (var j = 0; j < packedIds.length; ++j) {
                if (typeof packedIds[j] === 'number') {
                    packedIds[j] = uuids[packedIds[j]];
                }
            }
        }

        var subpackages = settings.subpackages;
        for (var subId in subpackages) {
            var uuidArray = subpackages[subId].uuids;
            if (uuidArray) {
                for (var k = 0, l = uuidArray.length; k < l; k++) {
                    if (typeof uuidArray[k] === 'number') {
                        uuidArray[k] = uuids[uuidArray[k]];
                    }
                }
            }
        }
    }

    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        cc.loader.onProgress = function (completedCount, totalCount, item) {
            var percent = 100 * completedCount / totalCount;
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var getParameterByName = function(name, url) 
    {
        if (!url) url = window.location.href;
        // console.log(url)
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    var onStart = function () {
        //美服
        // let country = getParameterByName("bid",null);
        var biChannel = "G123";//country==="us"?"G123_US":"G123";
        var biCountry = "JP";  //country==="us"?"US":"JP";
        window.elex_bi_init({
            ELEX_APP_ID:"38",
            ELEX_BI_APP_LOG:false,//开启debug打印log(非必填)
            ELEX_APP_IS_DEVELOP:false,//是否为开发环境，true为开发环境(非必填,默认开发环境)
            ELEX_APP_BI_CHANNEL_ID: biChannel,
            ELEX_APP_BI_COUNTRY_ID: biCountry,
            ELEX_APP_BI_PLATFORM_ID:'G123',
            success:function(res){
                console.log("== == =tempid:",res.tempId);
                // console.log("country==="+getParameterByName("bid",null));
            }
            });
        window["ELEX_BI"].toBI(window["BI_API"].Launch);
        
        var river_bi = window["RiverBI"];
        river_bi && river_bi.init({
            app_id:"102",
            platform:biChannel,
            channel:biChannel,
            country:biCountry,
            debug:(!window["OnlineServer"]),
        });
        river_bi && river_bi.sendToBI("launch",{});

        cc.loader.downloader._subpackages = settings.subpackages;

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (!false && !false) {
            // if (cc.sys.isBrowser) {
            //     setLoadingDisplay();
            // }

            if (cc.sys.isMobile) {
                if (settings.orientation === 'landscape') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
                }
                else if (settings.orientation === 'portrait') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
                }
                cc.view.enableAutoFullScreen([
                    cc.sys.BROWSER_TYPE_BAIDU,
                    cc.sys.BROWSER_TYPE_WECHAT,
                    cc.sys.BROWSER_TYPE_MOBILE_QQ,
                    cc.sys.BROWSER_TYPE_MIUI,
                    cc.sys.BROWSER_TYPE_CHROME
                ].indexOf(cc.sys.browserType) < 0);
            }

            //TANJIAN 测试代码
            // var resetFullScreen = function(){
            //     cc.view._resizeEvent();
            //     cc.screen.autoFullScreen(cc.game.frame);
            // }
            // if (document && document.addEventListener) {
            //     document.addEventListener("fullscreenchange", resetFullScreen);
            //     document.addEventListener("mozfullscreenchange", resetFullScreen);
            //     document.addEventListener("webkitfullscreenchange", resetFullScreen);
            //     document.addEventListener("msfullscreenchange", resetFullScreen);
            // }

            // Limit downloading max concurrent task to 2,
            // more tasks simultaneously may cause performance draw back on some android system / browsers.
            // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
            if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
                cc.macro.DOWNLOAD_MAX_CONCURRENT = 2;
            }
        }

        function loadScene(launchScene) {
            cc.director.loadScene(launchScene, null,
                function () {
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                    }
                    cc.loader.onProgress = null;
                    console.log('Success to load scene: ' + launchScene);
                }
            );

        }

        var launchScene = settings.launchScene;

        // load scene
        loadScene(launchScene);
        
        window["ELEX_BI"].toBI(window["BI_API"].LaunchEnd);

    };

    // jsList
    var jsList = settings.jsList;

    if (false) {
        BK.Script.loadlib();
    }
    else {
        var bundledScript = settings.debug ? 'src/project.dev.js' : 'src/project.a4341.js';
        if (jsList) {
            jsList = jsList.map(function (x) {
                return 'src/' + x;
            });
            jsList.push(bundledScript);
        }
        else {
            jsList = [bundledScript];
        }
    }
    var notcache = false;
    try {
        var useUpdate = localStorage.getItem("G123_ForceUpdate")+""
        notcache = (useUpdate=="1");
        try {
            localStorage.setItem("G123_ForceUpdate","0")
            if (notcache) {
                localStorage.setItem('LOADED_FLAG',"0");
            }
        } catch (error) {
            notcache = false;//匿名模式暂且先用缓存
        }
    }catch(err) {
        // alert("このブラウザではcookieの使用が制限されています。cookieの制限を解除すると、より快適にビビッドアーミーを遊ぶことができます。");
        if (window.showAlertPop) {
            window.showAlertPop();
        }
    }
    var option = {
        id: 'GameCanvas',
        scenes: settings.scenes,
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: !false && settings.debug,
        frameRate: 60,
        jsList: jsList,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
        noCache:notcache,
    }
    cc.macro.DOWNLOAD_MAX_CONCURRENT = 64
    cc.macro.CLEANUP_IMAGE_CACHE = true;

    // init assets
    cc.AssetLibrary.init({
        libraryPath: 'res/import',
        rawAssetsBase: 'res/raw-',
        rawAssets: settings.rawAssets,
        packedAssets: settings.packedAssets,
        md5AssetsMap: settings.md5AssetsMap,
        subpackages: settings.subpackages
    });

    cc.game.run(option, onStart);
};

// main.8b5c8.js is qqplay and jsb platform entry file, so we must leave platform init code here
if (false) {
    BK.Script.loadlib('GameRes://src/settings.js');
    BK.Script.loadlib();
    BK.Script.loadlib('GameRes://libs/qqplay-downloader.js');

    var ORIENTATIONS = {
        'portrait': 1,
        'landscape left': 2,
        'landscape right': 3
    };
    BK.Director.screenMode = ORIENTATIONS[window._CCSettings.orientation];
    initAdapter();
    cc.game.once(cc.game.EVENT_ENGINE_INITED, function () {
        initRendererAdapter();
    });

    qqPlayDownloader.REMOTE_SERVER_ROOT = "";
    var prevPipe = cc.loader.md5Pipe || cc.loader.assetLoader;
    cc.loader.insertPipeAfter(prevPipe, qqPlayDownloader);
    
    window.boot();
}
else if (window.jsb) {

    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.e9f56.js');
        require('src/cocos2d-runtime.js');
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.e9f56.js');
        require('src/cocos2d-jsb.js');
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}