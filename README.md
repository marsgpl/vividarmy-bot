# Vividarmy bot

## Local

    docker network create vividarmybot
    cd ~/projects/vividarmy/bot
    npm ci
    docker-compose up -d mongo
    ./db
        db.disableFreeMonitoring()
        db.players.ensureIndex({ nameLowercase:1, serverId:1 }, { unique:false })
        db.players.ensureIndex({ playerId:1 }, { unique:true })
    npm start discord-dev
    npm start farm-dev

## Prod

    ssh vividarmy-bot@g123
        docker network create vividarmybot
        cd ~/vividarmy-bot
        git pull
        docker-compose up -d mongo
        docker-compose restart discord
        docker-compose restart farm

## Discord bots

    prod:
    https://discord.com/oauth2/authorize?client_id=760167618790555668&scope=bot
    dev:
    https://discord.com/oauth2/authorize?client_id=763330023422689311&scope=bot
