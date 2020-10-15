null > {
    const: r = await, game: .wsRPC(847, {
        devPlatform: 'g123',
        channel: 'g123',
        lineAddress: ''
    }),
    const: playerInfo = r ? .playerInfo : ,
    if: function () { } };
!r ? .serverList || !r ? .showServerList ? .serverList :  :  : ;
{
    game.reporter("getAllServers fail");
    return null;
}
r.playerInfo = JSON.parse(playerInfo);
r.serverList.map(function (server) {
    server.playerInfo = JSON.parse(server.playerInfo);
});
return r;
as;
AllServers;
