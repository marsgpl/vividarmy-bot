# Vividarmy (g123) botfarm

## Cmd

    docker network create vividarmybotfarm

    cd ~/projects/vividarmy/botfarm
    docker-compose up mongo
    docker-compose up bot

    cd ~/projects/vividarmy/botfarm/bot
    npm run bot

    docker exec -it $(docker ps -a -q -f name=vividarmybotfarm_mongo) mongo -u root -p R1PDlGcd2xiDvCHD5fZEMX7gBj82BCls --authenticationDatabase admin vividarmybotfarm

        db.disableFreeMonitoring()
