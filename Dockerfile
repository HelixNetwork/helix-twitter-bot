FROM node:10.21.0-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8966
CMD [ "node", "index.js" ]