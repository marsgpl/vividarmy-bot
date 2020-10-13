export interface Config {
    browser: {
        userAgent: string;
        userAgentTemplate: string;
    };
    proxy: {
        required: boolean;
        socks5?: {
            host: string;
            port: number;
        }[];
    };
    mongo: {
        connectUrl: string;
        db: string;
    };
    discord: {
        app: {
            name: string;
            clientId: string;
            clientSecret: string;
            bot: {
                name: string;
                nametag: string;
                token: string;
            };
            allowedChannelsIds: {[channelId: string]: string};
            adminUsersIds: {[userId: string]: string};
        };
        gameAccount: {
            gpToken: string;
            cookieDocId: string;
        };
        gameAccountSvS?: {
            gpToken: string;
            cookieDocId: string;
        };
    };
    game: {
        printWsPackets: boolean;
        printWsPacketsMaxLength: number;
        checkIp: {
            required: boolean;
            url: string;
            expectedAnswer: string;
        };
        gpTokenCookie: {
            name: string;
            params: {
                host: string;
                path: string;
            };
        };
        urls: {
            shell: string;
            game: string;
            getSession: string;
            getClientVersion: string;
            getClientVersion_referer: string;
            getServerInfo: string;
            getServerInfo_origin: string;
            getServerInfo_referer: string;
            gameWs_origin: string;
        };
    };
    farm: {
        targetServerId: number;
        resetServerId: number;
    };
}
