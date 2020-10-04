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
                token: string;
            };
            allowedChannelsIds: {[key: string]: string};
            adminUsersIds: {[key: string]: string};
        };
        gameAccount: {
            id: string;
            gp_token: string;
        };
    };
    game: {
        printWsPackets: boolean;
        checkIp: {
            required: boolean;
            url: string;
            expectedAnswer: string;
        };
        gpTokenCookieTemplate: string;
        urls: {[key: string]: string};
    };
    farm: {
        targetServerId: number;
    };
}
