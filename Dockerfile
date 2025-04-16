FROM node:22
WORKDIR /action
COPY . .
RUN npm install -g npm@latest
RUN npm ci
RUN npm run build
ENTRYPOINT ["node", "/action/dist/index.js"]
