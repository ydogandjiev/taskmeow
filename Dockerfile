# Base image
FROM node:12.22.12-stretch

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY yarn.lock ./
COPY package.json ./
RUN yarn install

# Bundle app source
COPY . .

# Expose server primary and debug ports
EXPOSE 3000
EXPOSE 35729

CMD [ "yarn", "start" ]