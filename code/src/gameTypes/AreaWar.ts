export interface AreaWarInfo {
    itsBoss: number; // 0/1
    award: number; // 0/1
    levelPoint: number; // 1/2/3/...
    reward?: AreaWarReward;
}

export interface AreaWarReward {
    coin: string; // "20400.0"
    id: string; // "110404"
    item: string; // "310001"
    num: string; // "20"
    rate: string; // "1"
    type: string; // "0"
}

export interface AreaWar {
    areaId: number; // 707
    chapterId: number; // 4
    extInfos: AreaWarInfo[];
    finish: number; // 0/1
    pveId: number; // 403
    pve_level: {
        cost_energy: number; // 0
        enemy_config: string; // "12004,12004,12003,11004"
        enemy_type: number; // 0
        id: number; // 403
        level_count: number; // 3
        node: number; // 4
        order: number; // 3
        player_number: number; // 3
        player_type: number; // 0
        reward: number; // 110404
        using: number; // 1
    };
    pve_node: {
        icon: string; // "boss4"
        name: string; // "104120"
        order: number; // 4
    };
}
