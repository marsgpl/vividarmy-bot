const fs = require('fs');
const Discord = require('discord.js');

const cws = require('constants/ws-game');

const log = require('modules/log');
const sleep = require('modules/sleep');
const Browser = require('modules/Browser');

const getClientVersion = require(`commands/getClientVersion`);
const checkProxy = require(`commands/checkProxy`);
const getServerInfo = require(`commands/getServerInfo`);
const connectToGameWs = require(`commands/connectToGameWs`);

const discordBotConfig = JSON.parse(fs.readFileSync('./discord.json'));
const gameBotConfig = JSON.parse(fs.readFileSync('./g123.json'));
const nameToPid = JSON.parse(fs.readFileSync('./aliases.json'));

log(Object.keys(nameToPid).length, 'keys in db');

const bot = new Discord.Client();

const discordState = {};

bot.login(discordBotConfig.discord.app.bot.token);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}`);
});

process.on('unhandledRejection', (reason, promise) => {
    log('unhandledRejection:', reason, promise);
    if (discordState.msg) {
        discordState.msg.channel.send(`Error: ${reason}`);
    }
    process.exit(1);
});

process.on('uncaughtException', (reason, promise) => {
    log('uncaughtException:', reason, promise);
    if (discordState.msg) {
        discordState.msg.channel.send(`Error: ${reason}`);
    }
    process.exit(1);
});

process.on('SIGTERM', () => {
    log('SIGTERM:', 'caught, exiting');
    process.exit(1);
});

const state = {
    finding: false,
    name: false,
    pid: false,
    statusTitle: '',
    game: {
        started: false,
        ctx: {},
    },
};

bot.on('message', async msg => {
    if (msg.channel.id !== discordBotConfig.discord.channel.id) return;

    const m = msg.content.match(/^([a-z]+) (.*)$/i) || [];
    const cmd = m && m[1];
    const nameOrPid = (m && m[2] || '').replace(/[\s\r\n\t\v]/g, '').substr(0, 32);
    if (!cmd || !nameOrPid) return;
    if (cmd != 'find' && cmd != 'index') return;

    if (state.finding) {
        msg.channel.send(`Busy: looking for ${state.statusTitle}. Try again later.`);
        return;
    }

    discordState.msg = msg;

    state.finding = true;

    state.name = nameOrPid;
    state.pid = nameToPid[String(nameOrPid).toLowerCase()] || false;

    if (state.pid) {
        state.statusTitle = `name: ${state.name} (id found)`;
    } else {
        state.statusTitle = `name: ${state.name}`;
    }

    msg.channel.send(`Looking for ${state.statusTitle}`);

    if (!state.game.started) {
        msg.channel.send(`Starting game`);

        state.game.started = true;

        state.game.ctx = {
            conf: gameBotConfig,
            browser: new Browser({
                userAgent: gameBotConfig.browser.userAgent,
                socks5: gameBotConfig.socks5.g123,
            }),
            account: {
                data: {
                    userAgent: gameBotConfig.browser.userAgent,
                    aliSAFDataDetail: '134#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==',
                    gameData: {
                        userId: discordBotConfig.g123.player.deviceId,
                        code: discordBotConfig.g123.player.code,
                    }
                },
            }
        };

        msg.channel.send(`Checking proxy`);

        await checkProxy(state.game.ctx);

        msg.channel.send(`Getting client version`);

        state.game.ctx.account.data.clientVersion = await getClientVersion(state.game.ctx);

        msg.channel.send(`Getting server info`);

        state.game.ctx.account.data.serverInfo = await getServerInfo(state.game.ctx, {
            appVersion: state.game.ctx.account.data.clientVersion.value,
            token: state.game.ctx.account.data.gameData.code,
        });

        msg.channel.send(`Connecting to game server`);

        await connectToGameWs(state.game.ctx, { account: state.game.ctx.account });

        state.game.pingItv && clearInterval(state.game.pingItv);

        state.game.pingItv = setInterval(() => {
            const packet = {
                [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_PING,
                [cws.WS_GAME_OUT_PACKET_INDEX]: String(state.game.ctx.gameWsNextPacketIndex++),
                [cws.WS_GAME_OUT_PAYLOAD]: {},
            };

            state.game.ctx.gameWs.send(JSON.stringify(packet));

            log('ping sent');
        }, 11000);
    }

    state.game.disconnectTimeout && clearTimeout(state.game.disconnectTimeout);

    state.game.disconnectTimeout = setTimeout(() => {
        msg.channel.send(`Disconnected from game`);
        state.game.ctx.gameWs.close();
        clearInterval(state.game.pingItv);
        state.game.started = false;
    }, 10 * 60 * 1000);

    if (state.pid) {
        msg.channel.send(`Sending direct player info request`);

        const packet = {
            [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_GET_PLAYER_INFO,
            [cws.WS_GAME_OUT_PACKET_INDEX]: String(state.game.ctx.gameWsNextPacketIndex++),
            [cws.WS_GAME_OUT_PAYLOAD]: {
                targetId: String(state.pid),
            },
        };

        state.game.ctx.gameWs.send(JSON.stringify(packet));

        state.game.reqTimeout && clearTimeout(state.game.reqTimeout);

        state.game.reqTimeout = setTimeout(() => {
            state.finding = false;
            msg.channel.send(`Failed to find player for ${state.statusTitle}\ntimeout 10s`);
        }, 10000);

        state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_PLAYER_INFO] = state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_PLAYER_INFO] || [];
        state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_PLAYER_INFO].push((ctx, data, payload) => {
            clearTimeout(state.game.reqTimeout);
            state.finding = false;

            const { point } = payload || {};

            if (point) {
                reportPoint(msg, point);
            } else {
                msg.channel.send(`Failed to find player for ${state.statusTitle}\ncommunication error: ${JSON.stringify(payload)}`);
            }
        });
    } else {
        const serversToSearch = [];

        serversToSearch.push(Number(state.game.ctx.account.data.gameData.authData.k));

        const crossServer = state.game.ctx.account.data.gameData.authData.crossServer; // [0].k
        const hasCrossServer = Array.isArray(crossServer) && crossServer.length > 0;

        if (hasCrossServer) {
            crossServer.forEach(s => {
                const serverN = Number(s.k);
                if (!serversToSearch.includes(serverN)) {
                    serversToSearch.push(serverN);
                }
            });
        }

        if (cmd != 'index') {
            msg.channel.send(`Not found on servers: ${serversToSearch.join(', ')}`);
            clearTimeout(state.game.reqTimeout);
            state.finding = false;
            return;
        }

        msg.channel.send(`Will search on these servers: ${serversToSearch.join(', ')} (will take long time)`);

        let packsSent = serversToSearch.length * 630;
        let packsReceived = 0;

        state.game.reqTimeout && clearTimeout(state.game.reqTimeout);

        state.game.reqTimeout = setTimeout(() => {
            state.finding = false;
            fs.writeFileSync('./aliases.json', JSON.stringify(nameToPid));
            msg.channel.send(`Failed to find player for ${state.statusTitle}\ntimeout 15m`);
        }, 15*60*1000);

        state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_MAP_INFO] = state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_MAP_INFO] || [];
        state.game.ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_MAP_INFO].push((ctx, data, payload) => {
            packsReceived++;

            if (packsReceived > 0 && packsReceived % 100 == 0) {
                msg.channel.send(`Received ${packsReceived} packets ...`);
                fs.writeFileSync('./aliases.json', JSON.stringify(nameToPid));
            }

            if (packsReceived >= packsSent) {
                // finish
                fs.writeFileSync('./aliases.json', JSON.stringify(nameToPid));
                msg.channel.send(`Long search finished`);
                clearTimeout(state.game.reqTimeout);
                state.finding = false;
                return false;
            }

            if (!payload || !payload.pointList) return;

            payload.pointList.forEach(point => {
                if (point.pointType == 1 && point.p && point.p.playerInfo) {
                    const playerInfo = JSON.parse(point.p.playerInfo);
                    const playerName = String(playerInfo.username);

                    nameToPid[playerName.toLowerCase()] = point.p.pid;

                    console.log(point.p.pid, playerName.toLowerCase());

                    if (playerInfo.username.toLowerCase() == state.name.toLowerCase()) {
                        msg.channel.send(`Player found!`);
                        reportPoint(msg, point);
                        state.name = playerInfo.username;
                    }
                }
            });

            return true;
        });

        for (let si = 0; si < serversToSearch.length; ++si) {
            const serverN = serversToSearch[si];
            const w = 30;
            const h = 30;

            msg.channel.send(`Sending 630 packets to server ${serverN} ...`);

            for (let x = w / 2; x < (512 + 15); x += w) {
                for (let y = h / 2; y < (1024 + 15); y += h) {
                    x = Math.min(x, 512 - 1);
                    y = Math.min(y, 1024 - 1);

                    const packet = {
                        [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_GET_MAP_INFO,
                        [cws.WS_GAME_OUT_PACKET_INDEX]: String(state.game.ctx.gameWsNextPacketIndex++),
                        [cws.WS_GAME_OUT_PAYLOAD]: {
                            x,
                            y,
                            k: serverN,
                            width: w,
                            height: h,
                            marchInfo: true,
                        },
                    };

                    state.game.ctx.gameWs.send(JSON.stringify(packet));

                    await sleep(500);
                }

                state.game.disconnectTimeout && clearTimeout(state.game.disconnectTimeout);

                state.game.disconnectTimeout = setTimeout(() => {
                    msg.channel.send(`Disconnected from game`);
                    state.game.ctx.gameWs.close();
                    clearInterval(state.game.pingItv);
                    state.game.started = false;
                }, 10 * 60 * 1000);
            }
        }
    }
});

const reportPoint = (msg, point) => {
    const { x, y, k, p } = point;
    const { level, shieldTime, playerInfo, pid, language, w, power, aid, a_tag } = p;
    const { avatarurl, usergender, username } = JSON.parse(playerInfo);

    const serverN = k == w ? k : `${k} / ${w}`;
    const fullName = a_tag ? `[${a_tag}] ${username}` : username;
    const accountId = aid;
    const profileId = pid;
    const playerPower = formatPower(power);
    const interfaceLang = language;
    const shieldDurationLeft = formatDuration(Math.round(shieldTime / 1000));
    const gender = usergender == 1 ? 'male' :
        usergender == 2 ? 'female' :
        'not specified';

    state.name = username;
    state.pid = profileId;
    const fromCache = nameToPid[String(state.name).toLowerCase()];
    if ((!fromCache || fromCache != state.pid) && state.pid) {
        nameToPid[String(state.name).toLowerCase()] = state.pid;
        fs.writeFileSync('./aliases.json', JSON.stringify(nameToPid));
    }

    msg.channel.send('--------\n    ' + [
        `Player: ${fullName}`,
        `Position: ${x},${y}`,
        `Server: ${serverN}`,
        `Level: ${level}`,
        // `Shield: ${shieldDurationLeft}`,
        `Power: ${playerPower}`,
        `Interface language: ${interfaceLang}`,
        `Gender: ${gender}`,
        `Picture: ${avatarurl}`,
        // `Profile id: ${profileId}`,
        // `Account id: ${accountId}`,
    ].join('\n    ') + '\n--------');
};

const formatPower = function(value) {
    value = Number(value);

    if (value < (1000)) {
        return value;
    } else if (value < (1000 * 1000)) {
        return (value / (1000)).toFixed(2) + 'k';
    } else if (value < (1000 * 1000 * 1000)) {
        return (value / (1000 * 1000)).toFixed(2) + 'M';
    } else if (value < (1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000)).toFixed(2) + 'B';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000)).toFixed(2) + 'T';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'aa';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'bb';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'cc';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'dd';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'ee';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'ff';
    } else if (value < (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)) {
        return (value / (1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000)).toFixed(2) + 'gg';
    } else {
        return 'too big';
    }
};

const formatDuration = function(seconds) {
    if (!seconds) {
        return 'no';
    } else if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 60 * 60) {
        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return `${minutes} minutes ${seconds} seconds`;
    } else if (seconds < 24 * 60 * 60) {
        const hours = Math.floor(seconds / (60 * 60));
        seconds -= hours * 60 * 60;
        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return `${hours} hours ${minutes} minutes ${seconds} seconds`;
    } else {
        return '> 1d';
    }
};
