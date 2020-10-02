FROM node:14.11.0

WORKDIR /vividarmy/bot

ENV TZ=Etc/UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY package-lock.json .
COPY package.json .
COPY tsconfig.json .

ENV NODE_ENV=production

RUN npm ci
