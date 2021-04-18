const log = require('modules/log').setName('completeNoobStage');
const cws = require('constants/ws-game');

module.exports = async function(ctx) {
    log('start');
};

// if received:
    // {"c":10264,"s":0,"d":"{\"reportId\":\"2607\",\"fromUser\":\"0\",\"title\":\"【新累計購入イベント(旧:ドリル採掘)について】\",\"fromUserInfo\":\"{}\",\"content\":\"司令官\\n\\nいつもビビッドアーミーをご利用いただき\\nありがとうございます。\\n\\n現在開催中の新累計購入イベント\\n(旧:ドリル採掘)についてご案内します。\\n\\n｢エネルギー塊｣はギフト購入のほかに、\\nダイヤ商店での購入でも\\n獲得することができます。\\n\\n購入金額に対して獲得できる\\nエネルギー塊の個数例は以下の通りです。\\n\\n43,200円：4,000個\\n21,600円：2,000個\\n10,800円：1,000個\\n5,800円：500個\\n2,400円：200個\\n1,200円：90個\\n960円：80個\\n580円：50個\\n480円：40個\\n240円：20個\\n120円：10個\\n\\n※ダイヤ商店での購入につきましては、\\n　購入ダイヤ数ではなく、購入金額で\\n　獲得数が設定されています。\\n\\n今後ともビビッドアーミーを\\nよろしくお願いいたします。\\n\\n『ビビッドアーミー』運営チーム\",\"rewardStatus\":0,\"sendTime\":1601114726,\"toUser\":\"478328459871\",\"mailType\":2,\"rewardId\":0,\"toUserInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_1_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"username\\\":\\\"wy.478328459871\\\"}\",\"reward_limit\":0,\"isFavorites\":0,\"mailId\":\"1682572341214817284\",\"xmlId\":-2,\"status\":0}","o":null}
// then send:
    // {"c":934,"o":"30","p":{}}

// if received:
    // {"c":10169,"s":0,"d":"{\"owner\":{\"uid\":429758898783,\"a_color\":7,\"symbolTotem\":11,\"name\":\"Ceranove\",\"playerInfo\":\"{\\\"nationalflag\\\":198,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/429758898783.jpg?v=1596674790590\\\",\\\"username\\\":\\\"Ceranove\\\"}\",\"a_totem\":11,\"aid\":349692,\"a_name\":\"SG20\",\"a_tag\":\"Sg20\"},\"wonderName\":\"\",\"pointId\":180369,\"serverType\":0,\"x\":288,\"y\":704,\"bornArea\":54,\"state\":2,\"time\":1601151418,\"haveServerType\":0,\"activityAid\":349692}","o":null}
// then ignore

// first login
// after receiving c:1
    // {"c":1318,"o":"33","p":{}}
    // {"c":671,"o":"34","p":{}}
    // {"c":128,"o":"35","p":{}}
    // {"c":861,"o":"36","p":{}}
    // {"c":847,"o":"37","p":{}}
    // {"c":1055,"o":"38","p":{}}
    // {"c":1394,"o":"39","p":{"activity":""}}
    // {"c":934,"o":"40","p":{}}
    // {"c":700,"o":"42","p":{"exchangeConfigVer":null}}
    // {"c":841,"o":"43","p":{}}
    // {"c":82,"o":"44","p":{}}
    // {"c":1484,"o":"45","p":{}}
    // {"c":873,"o":"54","p":{}}
    // {"c":1661,"o":"55","p":{}}
    // {"c":917,"o":"56","p":{}}
    // {"c":700,"o":"58","p":{"type":5,"exchangeConfigVer":"857678bd0f833200d55104f1c26b18b9"}}
        // this number 857678bd0f833200d55104f1c26b18b9
        // is from reply of c:700 ,\"exchangeConfigVer\":\"857678bd0f833200d55104f1c26b18b9\",

// received from c:1
    // "armys":[{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":24,\"y\":26,\"id\":\"1682572340091255810\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":22,\"y\":28,\"id\":\"1682572340091255811\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":22,\"y\":26,\"id\":\"1682572340091255812\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":23,\"y\":27,\"id\":\"1682572340091255813\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":23,\"y\":25,\"id\":\"1682572340091255814\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":21,\"y\":27,\"id\":\"1682572340091255815\",\"state\":0,\"march\":0},{\"warehouseId\":\"0\",\"armyId\":10002,\"x\":22,\"y\":24,\"id\":\"1682572340091255816\",\"state\":0,\"march\":0}]

// bind app
    // {"c":1652,"o":"59","p":{"type":1}}

// tutorial start
    // {"c":814,"o":"60","p":{"text":"1"}}
    // {"c":814,"o":"61","p":{"text":"2"}}

// merge initial units 1->2
    // {"c":203,"o":"118","p":{"delId":"1682572340091255815","targetId":"1682572340091255811"}}
    // {"c":203,"o":"129","p":{"delId":"1682572340091255812","targetId":"1682572340091255813"}}
    // {"c":203,"o":"130","p":{"delId":"1682572340091255814","targetId":"1682572340091255810"}}

// responses of merge:
    // {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}

    // {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":21,\"y\":27,\"id\":\"1682572340091255815\",\"state\":0,\"march\":0}","o":null}

    // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":21,\"y\":27,\"li\":[]}]}","o":null}

    // {"c":10012,"s":0,"d":"{\"power\":\"516.0\"}","o":null}

    // {"c":203,"s":0,"d":"{\"res\":\"suc\",\"targetId\":\"1682572340091255811\",\"armyId\":10002}","o":"118"}

// merge initial units 2->3
    // {"c":203,"o":"138","p":{"delId":"1682572340091255816","targetId":"1682572340091255811"}}

// tutorial
    // {"c":814,"o":"139","p":{"text":"3"}}
    // {"c":117,"o":"140","p":{"id":805}} <- open first map area
    // {"c":814,"o":"141","p":{"text":"4"}}

// merge initial units 2->3
    // {"c":203,"o":"149","p":{"delId":"1682572340091255810","targetId":"1682572340091255813"}}

// merge initial units 3->4
    // {"c":203,"o":"151","p":{"delId":"1682572340091255813","targetId":"1682572340091255811"}}

// response on last merge:
    // {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}

    // {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10003,\"x\":23,\"y\":27,\"id\":\"1682572340091255813\",\"state\":0,\"march\":0}","o":null}

    // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":23,\"y\":27,\"li\":[]}]}","o":null}

    // {"c":10124,"s":0,"d":"{\"treasureTasks\":[{\"num\":1.0,\"state\":1,\"taskId\":3}],\"isUpdate\":1}","o":null}

    // {"c":10709,"s":0,"d":"{\"shareTips\":{\"armyTips\":[\"10004\"],\"buildingTips\":[]}}","o":null}

    // {"c":10012,"s":0,"d":"{\"power\":\"529.0\"}","o":null}

    // {"c":203,"s":0,"d":"{\"res\":\"suc\",\"targetId\":\"1682572340091255811\",\"armyId\":10004}","o":"151"}

// use:
    // {"c":828,"o":"152","p":{"type":1,"itemid":"10004"}}
    // <- {"c":828,"s":0,"d":"{\"result\":\"success\"}","o":"152"}
