# Vividarmy bot

## Local

    docker network create vividarmybot
    cd ~/projects/vividarmy-bot
    docker-compose up -d mongo
    ./db
        db.disableFreeMonitoring()
        db.players.ensureIndex({ nameLowercase:1, serverId:1 }, { unique:false })
        db.players.ensureIndex({ playerId:1 }, { unique:true })
    cd code
    npm ci
    npm run discord-dev
    npm run farm-dev

## Prod

    ssh vividarmy-bot@g123
        docker network create vividarmybot
        cd ~/vividarmy-bot
        git pull
        docker-compose up -d mongo
        docker-compose restart discord
        docker-compose restart farm

        for ID in {1..170}; do npm run farm-prod lvl3 $ID; done
        npm run farm-prod lvl3 1
        npm run farm-prod all lvl3 1 170

## Discord bots

    prod:
    https://discord.com/oauth2/authorize?client_id=760167618790555668&scope=bot
    dev:
    https://discord.com/oauth2/authorize?client_id=763330023422689311&scope=bot

## locale

    https://knight-cdn.akamaized.net/DynRes/1.3.1357/assets/locale/en_1.3.1357.txt
