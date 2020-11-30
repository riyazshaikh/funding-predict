# funding-predict
This project aims to predict funding based on crunchbase data. It consists of 2 parts:
* A data loader that outputs a json list of crunchbase organizations along with details of latest funding
* A web app that uses (ml5.js)[https://learn.ml5js.org] to train + classify model for predicting funding

## Usage
(Live Demo)[https://ventures-645.web.app]
The demo allows you to do the following:
1. Choose features for prediction (expensive to consider all of them)
2. Train a simple neural network i.e. Sequential MLP with single hidden layer
3. Observe training performance, and increase training epochs if necessary
4. Test prediction by entering an input combination

Note that some feature combinations may cause performance issues. Please be patient if the browser seems unresponsive.

## Setup Data Loader
First configure database connectivity by entering credentials in .env file. No need for SSL when connecting locally.
```
HOSTNAME=localhost
DATABASE=postgres
USERNAME=postgres
PASSWORD=postgres
#SSL_CA=server-ca.pem
#SSL_KEY=client-key.pem
#SSL_CERT=client-cert.pem
```

Then run the following command to generate companies.json.
````
npm i && npm run data
```

## Setup Web App
The Web App was built using (Vue CLI Instant Prototyping)[https://cli.vuejs.org/guide/prototyping.html], so requires the following global packages.

```
npm install -g @vue/cli @vue/cli-service-global
```

To run locally
```
npm run start
```

To build for deployment
```
npm run build
```