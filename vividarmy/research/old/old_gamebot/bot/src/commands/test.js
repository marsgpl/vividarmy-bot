const log = require('modules/log').setName('test');
const sleep = require('modules/sleep');
const randomString = require('modules/randomString');

const checkProxy = require('commands/checkProxy');
const completeNoobStage = require('commands/completeNoobStage');
const connectToGameWs = require('commands/connectToGameWs');
const createGameAccount = require('commands/createGameAccount');
const getClientVersion = require('commands/getClientVersion');
const getServerInfo = require('commands/getServerInfo');
const loadAccountFromMongo = require('commands/loadAccountFromMongo');
const requestInitialGameData = require('commands/requestInitialGameData');
const switchServer = require('commands/switchServer');

module.exports = async function(ctx) {
    log('start');

    const { conf } = ctx;

    await checkProxy(ctx);

    const account = await loadAccountFromMongo(ctx, {
        accountId: ctx.accountId,
    });

    account.data.userAgent = account.data.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36';

    account.data.aliSAFDataHash = account.data.aliSAFDataHash || randomString(88, randomString.alpha.azAZ09_);

    account.data.aliSAFDataDetail = '134#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';

    await account.save();

    if (!account.data.gameData) {
        const gameData = await createGameAccount(ctx);
        account.data.gameData = gameData;
        await account.save();
    }

    const clientVersion = await getClientVersion(ctx);
    account.data.clientVersion = clientVersion;
    await account.save();

    const serverInfo = await getServerInfo(ctx, {
        appVersion: clientVersion.value,
        token: account.data.gameData.code,
    });
    account.data.serverInfo = serverInfo;
    await account.save();

    if (serverInfo.serverId != conf.vividarmy.targetServer) {
        await switchServer(ctx, {
            account,
            newServerId: conf.vividarmy.targetServer,
        });
    } else {
        await connectToGameWs(ctx, { account });
    }

    // every 10 seconds send this:
    // {"c":0,"o":"695","p":{}}

    await requestInitialGameData(ctx, { account });

    await completeNoobStage(ctx, { account });

    await sleep(20 * 1000);
};
