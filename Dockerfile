FROM node:20
WORKDIR /action
COPY . .
RUN npm install -g npm@latest
RUN npm ci
ENTRYPOINT ["node", "/action/src/index.js"]
