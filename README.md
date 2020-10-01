# Vividarmy bot

## Commands

    cd ~/projects/vividarmy/bot
    docker network create vividarmybot
    npm ci
    docker-compose up -d mongo

    docker exec -it $(docker ps -a -q -f name=vividarmybot_mongo) mongo -u root -p R1PDlGcd2xiDvCHD5fZEMX7gBj82BCls --authenticationDatabase admin bot

    db.disableFreeMonitoring()
