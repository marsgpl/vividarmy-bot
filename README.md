# Vividarmy bot

## Discord

    check acc:
    https://knight-g123.akamaized.net/worldbattlerelease/index.html?platform=ctw&code=njN0vuCkAE6Mdd7F1lZdmZ2MJ9g0wrwvfZFkbtl4szkBweFcvW9iwPlGO70Xk8sA

## Local

    docker network create vividarmybot
    cd ~/projects/vividarmy/bot
    npm ci
    docker-compose up -d mongo
    ./db
        db.disableFreeMonitoring()
        db.players.ensureIndex({ nameLowercase:1 }, { unique:false })
    npm start discord-dev
    npm start farm-dev

## Prod

    ssh vividarmy-bot@g123
        docker network create vividarmybot
        cd ~/vividarmy-bot
        git pull
        docker-compose up -d mongo
        ./db
            db.disableFreeMonitoring()
            db.players.ensureIndex({ nameLowercase:1 }, { unique:false })
        docker-compose restart discord
        docker-compose restart farm
