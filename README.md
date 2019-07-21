# Taskmeow

This is my implementation of Burke Holland's great React CosmoDB sample.

[![Build status](https://ydogandjiev.visualstudio.com/taskmeow/_apis/build/status/taskmeow%20-%20CI)](https://ydogandjiev.visualstudio.com/taskmeow/_build/latest?definitionId=16)
[![Build Status](https://travis-ci.org/ydogandjiev/taskmeow.svg?branch=master)](https://travis-ci.org/ydogandjiev/taskmeow)
[![Coverage Status](https://coveralls.io/repos/github/ydogandjiev/taskmeow/badge.svg?branch=master)](https://coveralls.io/github/ydogandjiev/taskmeow?branch=master)

## Installing

```bash
git clone https://github.com/ydogandjiev/taskmeow.git
cd taskmeow
yarn install
```

## Running The App

The template can be run in development, or in production. For development, use the following workflow.

### Configure environment

Create a `.env` file at the root of the repository with the following values:

```bash
APPSETTING_AAD_ApplicationId="<AAD App ID>"
APPSETTING_AAD_ApplicationSecret="<AAD App Secret>"
APPSETTING_AAD_BaseUri="<SSL Base Uri>"
SQLCONNSTR_DbUri="<DB Uri>"
SQLCONNSTR_DbUsername="<DB Username>"
SQLCONNSTR_DbPassword="<DB Password>"
APPINSIGHTS_INSTRUMENTATIONKEY="AppInsights Instrumentation Key"
```

### Start Create React App and Express Server

```bash
yarn start
```

### Start ngrok tunnel

For authentication to work it's recommended to use an ngrok tunnel to hoist the localhost site to an SSL uri:

```bash
ngrok http 3000 --host-header=rewrite [--subdomain=<YOUR_SUBDOMAIN>]
```

## Building For Production

In production, you want Express to serve up your app.

### Build React App

```bash
yarn build
```

Now simply visit the Express app at 'http://localhost:3001' and you will see your app served from the 'build' folder. That's all there is to it!
