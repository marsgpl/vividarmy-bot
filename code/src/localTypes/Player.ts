export interface Player {
    _id: string;
    playerId: string;
    serverId: number;
    name: string;
    nameLowercase: string;
    formatted?: string[];
}
