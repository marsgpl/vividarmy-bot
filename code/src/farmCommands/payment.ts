import { Farm } from 'class/Farm';
import md5 from 'md5';
import asyncForeach from 'modules/asyncForeach';
import b64d from 'modules/b64d';
import sleep from 'modules/sleep';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    const level = await puppet.gameBot.getCurrentLevel();
    const g123UserId = await puppet.gameBot.getG123UserId();

    const pricePerItem = 2; // Yen

    const queue = [
        {"c":703,"o":"36","p":{"exchangeId":13007,"name":"新人ギフト","isTest":0,"pf":"ctw"}},
// one time

    // boobs hero
        // {"c":703,"o":"347","p":{"exchangeId":13003,"name":"新人ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"47","p":{"exchangeId":13004,"name":"新人ギフト","isTest":0,"pf":"ctw"}},
    // tywin
        // {"c":703,"o":"428","p":{"exchangeId":12001,"name":"英雄ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"122","p":{"exchangeId":12011,"name":"英雄昇格ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"264","p":{"exchangeId":12012,"name":"英雄昇格ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"35","p":{"exchangeId":12013,"name":"英雄昇格ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"35","p":{"exchangeId":12014,"name":"英雄昇格ギフト","isTest":0,"pf":"ctw"}},
    // ebony boobs hero skin
        // {"c":703,"o":"50","p":{"exchangeId":200093,"name":"エイミーハロウィンスキン","isTest":0,"pf":"ctw"}},
    // growth fund
        // {"c":703,"o":"136","p":{"exchangeId":4100,"name":"成長基金","isTest":0,"pf":"ctw"}},
    // extra queue+1
        // {"c":703,"o":"42","p":{"exchangeId":25001,"name":"月パス","isTest":0,"pf":"ctw"}},
    // lvl 15 special
        // {"c":703,"o":"232","p":{"exchangeId":21501,"name":"Lv.15限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"204","p":{"exchangeId":21502,"name":"Lv.15限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"111","p":{"exchangeId":21503,"name":"Lv.15限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"43","p":{"exchangeId":21504,"name":"Lv.15限定ギフト","isTest":0,"pf":"ctw"}},
    // lvl 25 special
        // {"c":703,"o":"39","p":{"exchangeId":22501,"name":"Lv.25限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"39","p":{"exchangeId":22502,"name":"Lv.25限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"39","p":{"exchangeId":22503,"name":"Lv.25限定ギフト","isTest":0,"pf":"ctw"}},
    // lvl 35 special
        // {"c":703,"o":"54","p":{"exchangeId":23501,"name":"Lv.35限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"54","p":{"exchangeId":23502,"name":"Lv.35限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"54","p":{"exchangeId":23503,"name":"Lv.35限定ギフト","isTest":0,"pf":"ctw"}},
    // lvl 45 special
        // {"c":703,"o":"296","p":{"exchangeId":24501,"name":"Lv.45限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"296","p":{"exchangeId":24502,"name":"Lv.45限定ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"296","p":{"exchangeId":24503,"name":"Lv.45限定ギフト","isTest":0,"pf":"ctw"}},
    // expedition special
        // {"c":703,"o":"42","p":{"exchangeId":9110005,"name":"遠征軍クエスト20進撃補給","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"677","p":{"exchangeId":9110006,"name":"遠征軍クエスト60進撃補給","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"50","p":{"exchangeId":9110007,"name":"遠征軍クエスト100進撃補給","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"217","p":{"exchangeId":9110008,"name":"遠征軍クエスト130進撃補給","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"60","p":{"exchangeId":9110009,"name":"遠征軍クエスト160進撃補給","isTest":0,"pf":"ctw"}},
    // blue skin
        // {"c":703,"o":"83","p":{"exchangeId":37,"name":"アリアボイス","isTest":0,"pf":"ctw"}},
    // red skin
        // {"c":703,"o":"87","p":{"exchangeId":38,"name":"ジュリアボイス","isTest":0,"pf":"ctw"}},
    // some yellow hero skin
        // {"c":703,"o":"90","p":{"exchangeId":200091,"name":"メリルハロウィンスキン","isTest":0,"pf":"ctw"}},
    // wing hero skin
        // {"c":703,"o":"125","p":{"exchangeId":200092,"name":"コーデリアハロウィンスキン","isTest":0,"pf":"ctw"}},
    // pink hero skin
        // {"c":703,"o":"356","p":{"exchangeId":20201015,"name":"鹿目まどか（魔法少女）","isTest":0,"pf":"ctw"}},
    // school hero skin
        // {"c":703,"o":"359","p":{"exchangeId":20201016,"name":"暁美ほむら","isTest":0,"pf":"ctw"}},

// monthly

    // premium
        // {"c":703,"o":"33","p":{"exchangeId":5003,"name":"月パス","isTest":0,"pf":"ctw"}},

// weekly

    // gem card
        // {"c":703,"o":"416","p":{"exchangeId":2006,"name":"ダイヤ週パス","isTest":0,"pf":"ctw"}},
    // custom weekly reward
        // {"c":703,"o":"423","p":{"exchangeId":10030,"name":"exchange_name_10030","isTest":0,"pf":"ctw"}},

// daily

    // magic bag
        // {"c":703,"o":"407","p":{"exchangeId":180001,"name":"進化福袋","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"409","p":{"exchangeId":180002,"name":"豪華福袋","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"411","p":{"exchangeId":180003,"name":"究極福袋","isTest":0,"pf":"ctw"}},
    // unit +1
        // {"c":703,"o":"119","p":{"exchangeId":6000,"name":"進化補給","isTest":0,"pf":"ctw"}},
    // unit +2
        // {"c":703,"o":"117","p":{"exchangeId":6001,"name":"豪華補給","isTest":0,"pf":"ctw"}},
    // luxury
        // {"c":703,"o":"203","p":{"exchangeId":6002,"name":"究極補給","isTest":0,"pf":"ctw"}},
    // zuko stuff (changes every day weekly)
        // {"c":703,"o":"48","p":{"exchangeId":912201,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912202,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912203,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912204,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912205,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912206,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"48","p":{"exchangeId":912207,"name":"経済発展ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912501,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912502,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912503,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912504,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912505,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912506,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"51","p":{"exchangeId":912507,"name":"強襲ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912601,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912602,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912603,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912604,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912605,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912606,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":912607,"name":"防衛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"55","p":{"exchangeId":912701,"name":"英雄招集ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"45","p":{"exchangeId":912702,"name":"英雄招集ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"45","p":{"exchangeId":912703,"name":"英雄招集ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"45","p":{"exchangeId":912704,"name":"英雄招集ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"45","p":{"exchangeId":912705,"name":"英雄招集ギフト","isTest":0,"pf":"ctw"}},

// 4x3 roulette (every month with daily reset)

        // {"c":703,"o":"68","p":{"exchangeId":914701,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"139","p":{"exchangeId":914702,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"225","p":{"exchangeId":914703,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"727","p":{"exchangeId":914704,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"50","p":{"exchangeId":914705,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"50","p":{"exchangeId":914706,"name":"ラッキーコインギフト","isTest":0,"pf":"ctw"}},

// gems (any time)

    // 26k gems
        // {"c":703,"o":"131","p":{"exchangeId":34,"name":"25980ダイヤ","isTest":0,"pf":"ctw"}},
    // 13k gems
        // {"c":703,"o":"303","p":{"exchangeId":32,"name":"12980ダイヤ","isTest":0,"pf":"ctw"}},

// points store (monthly)

    // 6480
        // {"c":703,"o":"294","p":{"exchangeId":220005,"name":"6480pt","isTest":0,"pf":"ctw"}},
    // 3280
        // {"c":703,"o":"299","p":{"exchangeId":220004,"name":"3280pt","isTest":0,"pf":"ctw"}},

// autumn special (yearly?)

        // {"c":703,"o":"302","p":{"exchangeId":26000019,"name":"強化＆兵種自選箱","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"305","p":{"exchangeId":26000020,"name":"ダイヤ＆金貨","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"307","p":{"exchangeId":26000021,"name":"破片&スキル","isTest":0,"pf":"ctw"}},

// bird path

        // {"c":703,"o":"342","p":{"exchangeId":910314,"name":"高級試練報酬を解禁","isTest":0,"pf":"ctw"}},

// battery path

        // {"c":703,"o":"391","p":{"exchangeId":17002,"name":"exchangeName_17002","isTest":0,"pf":"ctw"}},

// back to work (every month with daily reset)

        // {"c":703,"o":"114","p":{"exchangeId":200181,"name":"特典科学ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"117","p":{"exchangeId":200182,"name":"特典招集ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"120","p":{"exchangeId":200183,"name":"特典金貨ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"122","p":{"exchangeId":200184,"name":"特典出撃ギフト","isTest":0,"pf":"ctw"}},

// amalia skill set

        // {"c":703,"o":"95","p":{"exchangeId":101755,"name":"まどか専用スキルギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"435","p":{"exchangeId":101756,"name":"まどか専用スキルギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"38","p":{"exchangeId":101757,"name":"まどか専用スキルギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"38","p":{"exchangeId":101758,"name":"まどか専用スキルギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"39","p":{"exchangeId":101765,"name":"まどか専用スキルギフト","isTest":0,"pf":"ctw"}},

// feather decoration (tank dmg +1%)

        // {"c":703,"o":"438","p":{"exchangeId":101759,"name":"キュゥべえギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"44","p":{"exchangeId":101760,"name":"キュゥべえギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"44","p":{"exchangeId":101761,"name":"キュゥべえギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"44","p":{"exchangeId":101762,"name":"キュゥべえギフト","isTest":0,"pf":"ctw"}},

// castles (one time)

    // CVN
        // {"c":703,"o":"37","p":{"exchangeId":400028,"name":"CVN-68ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"37","p":{"exchangeId":400028,"name":"CVN-68ギフト","isTest":0,"pf":"ctw"}},
    // gus cannon
        // {"c":703,"o":"41","p":{"exchangeId":400027,"name":"ガスキャノンギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"41","p":{"exchangeId":400027,"name":"ガスキャノンギフト","isTest":0,"pf":"ctw"}},
    // sky dragon
        // {"c":703,"o":"46","p":{"exchangeId":40012,"name":"ドラゴン要塞ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"46","p":{"exchangeId":40012,"name":"ドラゴン要塞ギフト","isTest":0,"pf":"ctw"}},
    // planetary fortress
        // {"c":703,"o":"49","p":{"exchangeId":40011,"name":"戦艦要塞ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"49","p":{"exchangeId":40011,"name":"戦艦要塞ギフト","isTest":0,"pf":"ctw"}},
    // metropolis
        // {"c":703,"o":"53","p":{"exchangeId":400029,"name":"合成で大都会基地スキンが手に入る","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"53","p":{"exchangeId":400029,"name":"合成で大都会基地スキンが手に入る","isTest":0,"pf":"ctw"}},
    // moon rabbit
        // {"c":703,"o":"56","p":{"exchangeId":40010,"name":"満月城ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"56","p":{"exchangeId":40010,"name":"満月城ギフト","isTest":0,"pf":"ctw"}},
    // supreme dragon
        // {"c":703,"o":"59","p":{"exchangeId":40003,"name":"竜の城ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"59","p":{"exchangeId":40003,"name":"竜の城ギフト","isTest":0,"pf":"ctw"}},
    // love blue
        // {"c":703,"o":"62","p":{"exchangeId":40021,"name":"愛の気球船ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"62","p":{"exchangeId":40021,"name":"愛の気球船ギフト","isTest":0,"pf":"ctw"}},
    // love pink
        // {"c":703,"o":"66","p":{"exchangeId":40022,"name":"永遠の愛ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"66","p":{"exchangeId":40022,"name":"永遠の愛ギフト","isTest":0,"pf":"ctw"}},
    // lucky dragon
        // {"c":703,"o":"69","p":{"exchangeId":40024,"name":"龍舞城ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"69","p":{"exchangeId":40024,"name":"龍舞城ギフト","isTest":0,"pf":"ctw"}},
    // super miner
        // {"c":703,"o":"72","p":{"exchangeId":40002,"name":"プラント破片ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"72","p":{"exchangeId":40002,"name":"プラント破片ギフト","isTest":0,"pf":"ctw"}},
    // blue lion
        // {"c":703,"o":"75","p":{"exchangeId":40006,"name":"氷麒麟ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"75","p":{"exchangeId":40006,"name":"氷麒麟ギフト","isTest":0,"pf":"ctw"}},
    // poetic yellow
        // {"c":703,"o":"78","p":{"exchangeId":40008,"name":"秋日明星ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"78","p":{"exchangeId":40008,"name":"秋日明星ギフト","isTest":0,"pf":"ctw"}},
    // poetic red
        // {"c":703,"o":"81","p":{"exchangeId":40009,"name":"秋風白露ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"81","p":{"exchangeId":40009,"name":"秋風白露ギフト","isTest":0,"pf":"ctw"}},
    // ice
        // {"c":703,"o":"84","p":{"exchangeId":40019,"name":"フロストシティギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"84","p":{"exchangeId":40019,"name":"フロストシティギフト","isTest":0,"pf":"ctw"}},
    // dragon boat
        // {"c":703,"o":"87","p":{"exchangeId":40004,"name":"龍船ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"87","p":{"exchangeId":40004,"name":"龍船ギフト","isTest":0,"pf":"ctw"}},
    // new year
        // {"c":703,"o":"90","p":{"exchangeId":40017,"name":"クリスマスギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"90","p":{"exchangeId":40017,"name":"クリスマスギフト","isTest":0,"pf":"ctw"}},
    // icecream
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"94","p":{"exchangeId":40005,"name":"お菓子の家ギフト","isTest":0,"pf":"ctw"}},
    // mushroom
        // {"c":703,"o":"97","p":{"exchangeId":40001,"name":"キノコ破片ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"97","p":{"exchangeId":40001,"name":"キノコ破片ギフト","isTest":0,"pf":"ctw"}},

// queue skin (one time)

    // cats plane
        // {"c":703,"o":"69","p":{"exchangeId":40020,"name":"特務工作ねずみギフト","isTest":0,"pf":"ctw"}},

// buy tech shards (daily)

    // R&D
        // {"c":703,"o":"82","p":{"exchangeId":9202111,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"86","p":{"exchangeId":9202112,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"86","p":{"exchangeId":9202113,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"86","p":{"exchangeId":9202114,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"309","p":{"exchangeId":9202115,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"309","p":{"exchangeId":9202116,"name":"重要施設設計図ギフト","isTest":0,"pf":"ctw"}},
    // gold build
        // {"c":703,"o":"71","p":{"exchangeId":9202001,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"71","p":{"exchangeId":9202002,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"71","p":{"exchangeId":9202003,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"71","p":{"exchangeId":9202004,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"185","p":{"exchangeId":9202005,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"185","p":{"exchangeId":9202006,"name":"金鉱設計図ギフト","isTest":0,"pf":"ctw"}},
    // gold merge
        // {"c":703,"o":"58","p":{"exchangeId":9202041,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"58","p":{"exchangeId":9202042,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"58","p":{"exchangeId":9202043,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"58","p":{"exchangeId":9202044,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"58","p":{"exchangeId":9202045,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"58","p":{"exchangeId":9202046,"name":"金鉱合成ギフト","isTest":0,"pf":"ctw"}},
    // navy unit
        // {"c":703,"o":"67","p":{"exchangeId":9202091,"name":"海軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"67","p":{"exchangeId":9202092,"name":"海軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"67","p":{"exchangeId":9202093,"name":"海軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"67","p":{"exchangeId":9202094,"name":"海軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
    // army unit
        // {"c":703,"o":"72","p":{"exchangeId":9202081,"name":"陸軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"72","p":{"exchangeId":9202082,"name":"陸軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"72","p":{"exchangeId":9202083,"name":"陸軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
        // {"c":703,"o":"72","p":{"exchangeId":9202084,"name":"陸軍LvUP図ギフト","isTest":0,"pf":"ctw"}},
    ];

    if (level < 3) {
        throw Error(`must be lvl 4+ (now: lvl ${level})`);
    }

    await asyncForeach(queue, async (essence: any) => {
        let exchangeId, exchangeName;

        if (Array.isArray(essence)) {
            [ exchangeId, exchangeName ] = essence;
        } else {
            exchangeId = essence.p.exchangeId;
            exchangeName = essence.p.name;
        }

        const orderAllowed = await puppet.gameBot.wsRPC(790, { exchangeId });

        if (orderAllowed?.allow !== 1) {
            throw Error('fail: orderAllowed');
        }

        const orderInit = await puppet.gameBot.wsRPC(703, {
            exchangeId,
            name: exchangeName,
            isTest: 0,
            pf: 'ctw',
        });

        const orderNo = orderInit?.orderNo;
        const orderToken = orderInit?.token;

        console.log('🔸 orderNo:', orderNo);
        console.log('🔸 orderToken:', orderToken);

        if (!orderNo || !orderToken) {
            throw Error('fail: orderInit');
        }

        const orderDetailsRaw = await puppet.gameBot.browser.post(`https://psp.g123.jp/api/app/orders/${orderNo}/active`, {}, {
            contentType: 'application/json',
            postData: JSON.stringify({
                appCode: 'vividarmy',
                userId: g123UserId,
                token: orderToken,
                extra: {
                    referer: '',
                    network_connection: '',
                    url: 'https://h5.g123.jp/game/vividarmy'
                },
                lang: 'ja',
            }),
            origin: 'https://psp.g123.jp',
            referer: 'https://psp.g123.jp/',
        });

        const orderDetailsJson = JSON.parse(orderDetailsRaw.body);
        const orderDetails = orderDetailsJson?.order;

        if (!orderDetails) {
            console.log('🔸 orderDetailsRaw.body:', orderDetailsRaw.body);
            throw Error('fail: orderDetails');
        }

        const orderClientRaw = await puppet.gameBot.browser.post('https://psp.g123.jp/api/app/creditucc/client-token', {}, {
            contentType: 'application/json',
            postData: '',
            origin: 'https://psp.g123.jp',
            referer: 'https://psp.g123.jp/payment',
        });

        const orderClientJson = JSON.parse(orderClientRaw.body);
        const clientToken = orderClientJson?.clientToken;
        const clientId = orderClientJson?.clientId;

        console.log('🔸 clientId:', clientId);
        console.log('🔸 clientToken:', clientToken);

        const clientTokenParsed = JSON.parse(b64d(clientToken));
        const bearer = clientTokenParsed?.paypal?.accessToken;

        if (!clientToken || !clientId || !bearer) {
            console.log('🔸 orderClientRaw.body:', orderClientRaw.body);
            console.log('🔸 b64d(clientToken):', b64d(clientToken));
            throw Error('fail: orderClient');
        }

        // GET https://www.paypal.com/sdk/js?components=hosted-fields&client-id=AUhZSE7U6NCT0fXtN7lO2T784NBSw1WJWvyVd9oSwXxjfyHK8fXHew--fuJ9LHgQEK3gRRpWaZPqSJAC

        // GET https://www.paypal.com/tagmanager/pptm.js?id=psp.g123.jp&t=xo&v=5.0.180&source=payments_sdk&client_id=AUhZSE7U6NCT0fXtN7lO2T784NBSw1WJWvyVd9oSwXxjfyHK8fXHew--fuJ9LHgQEK3gRRpWaZPqSJAC&comp=hosted-fields&vault=false

        const transactionTs = Date.now();
        const correlationId = md5(Math.random() + ':' + transactionTs);

        const p1Raw = await puppet.gameBot.browser.post('https://c.paypal.com/v1/r/d/b/p1', {}, {
            contentType: 'application/json',
            origin: 'https://c.paypal.com',
            referer: 'https://c.paypal.com/v1/r/d/i?js_src=https://www.paypalobjects.com/webstatic/r/fb/fb-all-prod.pp.min.js',
            postData: JSON.stringify({"appId":"BRAINTREE_SIGNIN","correlationId":correlationId,"payload":{"navigator":{"appName":"Netscape","appVersion":"5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36","cookieEnabled":false,"language":"en-US","onLine":true,"platform":"MacIntel","product":"Gecko","productSub":"20030107","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36","vendor":"Google Inc.","vendorSub":""},"screen":{"colorDepth":30,"pixelDepth":30,"height":900,"width":1440,"availHeight":900,"availWidth":1440},"window":{"outerHeight":900,"outerWidth":1440,"innerHeight":0,"innerWidth":0,"devicePixelRatio":2},"rvr":"20180625","activeXDefined":false,"flashVersion":{"major":0,"minor":0,"release":0},"tz":10800000,"tzName":"Europe/Moscow","dst":false,"time":transactionTs,"referer":"https://h5.g123.jp/","URL":"https://psp.g123.jp/payment","pt1":{"sf":"0000","tb":-1,"pp1":"2710.00","i":"2575.00","ph1":"11238.00"}}}),
        });

        const p1Json = JSON.parse(p1Raw.body);
        const p1Sc = p1Json?.sc;

        if (!p1Sc || !p1Json || p1Json.error) {
            console.log('🔸 p1Raw.body:', p1Raw.body);
            throw Error('fail: p1');
        }

        const p2Raw = await puppet.gameBot.browser.post('https://c.paypal.com/v1/r/d/b/p2', {}, {
            contentType: 'application/json',
            origin: 'https://c.paypal.com',
            referer: 'https://c.paypal.com/v1/r/d/i?js_src=https://www.paypalobjects.com/webstatic/r/fb/fb-all-prod.pp.min.js',
            postData: JSON.stringify({"appId":"BRAINTREE_SIGNIN","correlationId":correlationId,"fsoError":true,"fsoId":null,"payload":{"data":{"plugins":[{"mT":[{"t":"application/x-google-chrome-pdf","s":"pdf"}],"n":"Chrome PDF Plugin","fn":"internal-pdf-viewer","d":"Portable Document Format"},{"mT":[{"t":"application/pdf","s":"pdf"}],"n":"Chrome PDF Viewer","fn":"mhjfbmdgcfjbbpaeojofohoefgiehjai","d":""},{"mT":[{"t":"application/x-nacl","s":""},{"t":"application/x-pnacl","s":""}],"n":"Native Client","fn":"internal-nacl-plugin","d":""}]},"sc":{"sc-lst":null,"sc-flash":null,"httpCookie":true},"pt2":{"flash":"0.14","cp":"1.24","cd2":"1.59","pp2":"18.36"},"time":transactionTs}}),
        });

        const p2Json = JSON.parse(p2Raw.body);
        const p2Sc = p2Json?.sc;

        if (!p2Sc || !p2Json || p2Json.error) {
            console.log('🔸 p2Raw.body:', p2Raw.body);
            throw Error('fail: p2');
        }

        const p3Raw = await puppet.gameBot.browser.get(`https://c6.paypal.com/v1/r/d/b/p3?f=${correlationId}&s=BRAINTREE_SIGNIN`, {}, {
            referer: 'https://c.paypal.com/',
        });

        if (p3Raw.statusCode !== 200) {
            console.log('🔸 p3Raw:', p3Raw);
            throw Error('fail: p3');
        }

        await puppet.gameBot.getSession();

        const wRaw = await puppet.gameBot.browser.get(`https://c.paypal.com/v1/r/d/b/w?&f=${correlationId}&s=BRAINTREE_SIGNIN&d=%7B%22rDT%22%3A%2210818%2C10576%2C26160%3A31313%2C31072%2C30755%3A46682%2C46443%2C46108%3A41559%2C41322%2C40988%3A10821%2C10586%2C10254%3A26190%2C25958%2C25624%3A21065%2C20837%2C20507%3A36430%2C36211%2C35863%3A21055%2C20846%2C20497%3A15924%2C15728%2C15378%3A36406%2C36226%2C35879%3A31272%2C31109%2C30738%3A15889%2C15745%2C15374%3A41489%2C41366%2C40994%3A31227%2C31125%2C30752%3A26088%2C26006%2C25616%3A20903%2C20895%2C20539%3A41392%2C41387%2C40992%3A31141%2C31143%2C30753%3A36261%2C36266%2C35871%3A18477%2C21%22%7D`, {}, {
            referer: 'https://c.paypal.com/',
        });

        if (wRaw.statusCode !== 204) {
            console.log('🔸 wRaw:', wRaw);
            throw Error('fail: w');
        }

        const orderConfirmRaw = await puppet.gameBot.browser.post('https://psp.g123.jp/api/app/creditucc/create-order', {}, {
            contentType: 'application/json',
            postData: JSON.stringify({
                code: 'JPY',
                value: String(pricePerItem),
                orderNo: orderDetails.orderNo,
                appCode: orderDetails.appCode,
                items: orderDetails.items.map((item: any) => {
                    item.amt = Number(pricePerItem);
                    return item;
                }),
            }),
            origin: 'https://psp.g123.jp',
            referer: 'https://psp.g123.jp/payment',
        });

        const orderConfirmJson = JSON.parse(orderConfirmRaw.body);
        const orderId = orderConfirmJson?.orderID;

        console.log('🔸 orderId:', orderId);

        if (!orderId) {
            console.log('🔸 orderConfirmRaw.body:', orderConfirmRaw.body);
            throw Error('fail: orderConfirm');
        }

        const validatedRaw = await puppet.gameBot.browser.post(`https://cors.api.paypal.com/v2/checkout/orders/${orderId}/validate-payment-method`, {
            headers: {
                'PayPal-Client-Metadata-Id': correlationId,
                'Authorization': `Bearer ${bearer}`,
                'Braintree-SDK-Version': '3.32.0-payments-sdk-dev',
            },
        }, {
            contentType: 'application/json',
            postData: JSON.stringify({"payment_source":{"card":{"number":"5536913777624368","expiry":"2023-05","security_code":"675"}},"application_context":{"vault":false}}),
            origin: 'https://assets.braintreegateway.com',
            referer: 'https://cors.api.paypal.com/',
        });

        const validatedJson = JSON.parse(validatedRaw.body);

        if (!validatedJson?.payment_source) {
            console.log('🔸 validatedRaw.body:', validatedRaw.body);
            throw Error('fail: validate-payment-method');
        }

        const checkoutRaw = await puppet.gameBot.browser.post(`https://psp.g123.jp/api/app/orders/${orderNo}/checkout`, {}, {
            contentType: 'application/json',
            postData: JSON.stringify({
                paymentCode: 'creditucc',
                appCode: 'vividarmy',
                userId: g123UserId,
                isUnbind: false,
                extra: {
                    withAgeVerification: true,
                    details: {
                        card: {
                            last_digits: '4368',
                            brand: 'MASTER_CARD',
                            type: 'CREDIT',
                            card_type: 'MASTER_CARD'
                        },
                        orderId,
                    },
                },
            }),
            origin: 'https://psp.g123.jp',
            referer: 'https://psp.g123.jp/payment',
        });

        const checkoutJson = JSON.parse(checkoutRaw.body);

        console.log('🔸 checkoutJson:', checkoutJson);

        await sleep(10000);
    });
}
