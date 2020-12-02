# funding-predict
This project aims to predict funding based on crunchbase data. It consists of 2 parts:
* A web app that uses [ml5.js](https://learn.ml5js.org) to train a neural network in the browser
* A data loader that outputs a json list of crunchbase organizations along with details of latest funding

## Usage
[Live Demo](https://ventures-645.web.app)

The demo allows you to:
1. Choose features for prediction (expensive to consider all of them)
2. Train a simple neural network i.e. Sequential MLP with single hidden layer
3. Observe training performance, and increase training epochs if necessary
4. View predictions for companies founded within last 2 years, and compare accuracy

Note that some feature combinations may cause performance issues. Please be patient if the browser seems unresponsive. Refresh page if out of memory.

## Setup Web App
The Web App was built using [Vue CLI Instant Prototyping](https://cli.vuejs.org/guide/prototyping.html), so requires the following global packages.

```sh
npm install -g @vue/cli @vue/cli-service-global
```

To run locally
```sh
npm run start
```

To build for deployment
```sh
npm run build
```

## Setup Data Loader
First configure database connectivity by entering credentials in .env file. No need for SSL when connecting locally.
```sh
HOSTNAME=localhost
DATABASE=postgres
USERNAME=postgres
PASSWORD=postgres
#SSL_CA=server-ca.pem
#SSL_KEY=client-key.pem
#SSL_CERT=client-cert.pem
```

Then run the following command to generate companies.json.
```sh
npm i && npm run data
```
