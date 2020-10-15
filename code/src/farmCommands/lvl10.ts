import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    // @TODO check for already done

    if (puppet.can(`researchScienceById:310006`)) {
        throw Error('lvl5 not ready');
    }

    await puppet.relocateOldTankToLeft();
    await puppet.removeObstacle(1023, { x:20, y:20 }, 'Stone');
    await puppet.removeObstacle(1022, { x:20, y:16 }, 'Ad chest');




    // spawn some units from bag
    // {"c":202,"o":"123","p":{"armyId":10004,"x":24,"y":28}}
    // {"c":202,"o":"124","p":{"armyId":10004,"x":22,"y":30}}
    // {"c":202,"o":"125","p":{"armyId":10004,"x":23,"y":29}}

    // {"c":202,"o":"125","p":{"armyId":10005,"x":26,"y":26,"id":"1710811465084658695"}}
    // {"c":202,"o":"125","p":{"armyId":10005,"x":27,"y":25,"id":"1710811447837680643"}}
    // {"c":202,"o":"125","p":{"armyId":10005,"x":28,"y":24,"id":"1710811486039401475"}}
    // {"c":202,"o":"125","p":{"armyId":10005,"x":29,"y":25,"id":"1710812353807344645"}}

    // merge units until: lvl6x3 oldtankx1

    // buy next base map area {"c":117,"o":"70","p":{"id":606}}

    // fight x2
    // {"c":420,"o":"74","p":{"pveId":501,"armyList":["1710383599301780487","1710380319741928456"],"areaId":606,"heroList":[],"trapList":[]}}

    // fight x2
    // {"c":420,"o":"77","p":{"pveId":502,"armyList":["1710383599301780487","1710380319741928456"],"areaId":606,"heroList":[],"trapList":[]}}

    // fight x3 (HARD)
    // {"c":420,"o":"79","p":{"pveId":503,"armyList":["1710383599301780487","1710380319741928456"],"areaId":606,"heroList":[],"trapList":[]}}

    // put units from bag to base map
    // {"c":202,"o":"83","p":{"armyId":10006,"x":31,"y":19}}
    // {"c":202,"o":"84","p":{"armyId":10006,"x":30,"y":20}}
    // {"c":202,"o":"85","p":{"armyId":10006,"x":29,"y":21}}
    // {"c":202,"o":"86","p":{"armyId":10006,"x":28,"y":22}}
    // {"c":202,"o":"87","p":{"armyId":10006,"x":27,"y":21}}
        // {"c":202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10006,\"x\":31,\"y\":19,\"id\":\"1710802505078236166\",\"state\":0,\"march\":0}","o":"83"}
        // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":true,\"x\":23,\"y\":29,\"li\":[{\"t\":2,\"i\":10005}]}]}","o":null}
        // {"c":10203,"s":0,"d":"{\"armyNum\":4,\"armyId\":10006,\"overdueTime\":0}","o":null}
        // {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10006,\"x\":31,\"y\":19,\"id\":\"1710802505078236166\",\"state\":0,\"march\":0}","o":null}

    // repair tax center
    // {"c":113,"o":"117","p":{"id":"1710380319658042374"}}
        // {"c":113,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":0,\"buildingId\":2201,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":28,\"y\":18,\"proCount\":0.0,\"state\":1,\"id\":\"1710380319658042374\",\"proTime\":0.0,\"proLastTime\":0.0}}","o":"117"}

    // relocate units to top left:
    // old tanks
        // {"c":110,"o":"194","p":{"x":20,"y":16,"id":"1710383599301780487"}}
    // lvl 6's
        // {"c":110,"o":"197","p":{"x":19,"y":17,"id":"1710380319741928456"}}
        // {"c":110,"o":"198","p":{"x":20,"y":18,"id":"1710811465084658695"}}
        // {"c":110,"o":"199","p":{"x":21,"y":17,"id":"1710808812690695168"}}











    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
}
