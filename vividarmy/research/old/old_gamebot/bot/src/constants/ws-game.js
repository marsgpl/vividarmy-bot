module.exports = {
    // from client to server
    WS_GAME_OUT_COMMAND: 'c',
    WS_GAME_OUT_PACKET_INDEX: 'o',
    WS_GAME_OUT_PAYLOAD: 'p',

    // from server to client
    WS_GAME_IN_COMMAND: 'c',
    WS_GAME_IN_PACKET_INDEX: 'o',
    WS_GAME_IN_PAYLOAD: 'd',

    WS_GAME_COMMAND_AUTH: 1,
    WS_GAME_COMMAND_GET_SERVER_LIST: 847,
    WS_GAME_COMMAND_CHANGE_SERVER: 848,
};
