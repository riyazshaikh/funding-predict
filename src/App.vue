<template>
    <div>
        <h1>Funding Prediction</h1>
        <div class="features">
            <h3>Select input features</h3>
            <select v-model="features" multiple>
                <option
                    v-for="opt in featureOpts"
                    :key="opt"
                    :value="opt"
                >{{formatKey(opt)}}</option>
            </select>
            <h3>Select predicted feature</h3>
            <select v-model="prediction">
                <option
                    v-for="opt in featureOpts"
                    :key="opt"
                    :value="opt"
                >{{formatKey(opt)}}</option>
            </select>
            <h3>Select epochs to train</h3>
            <input type="number" v-model="epochs" />
            <br/>
            <button
                v-if="features.length && prediction"
                @click="triggerTrain"
                :disabled="!data || inProgress"
            >Train</button>
        </div>
        <div v-if="trained">
            <h3>Predict</h3>
            <div
                v-for="feature in features"
                :key="feature"
                class="predict-inputs"
            >
                <label>{{formatKey(feature)}}</label>
                <select
                    v-model="inputs[feature]"
                >
                    <option
                        v-for="opt in uniqueOpts(feature)"
                        :key="opt"
                        :value="opt"
                    >{{opt}}</option>
                </select>
            </div>
            <button
                @click="triggerPredict"
                :disabled="inProgress"
            >Predict</button>
        </div>
        <div class="result">{{result}}</div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            data: null,
            features: ['founded_date','headquarters'],
            featureOpts: ['founded_date', 'headquarters', 'total_funding_usd', 'funding_type', 'series'],
            prediction: 'series',
            inputs: {},
            trained: false,
            inProgress: false,
            result: 'Loading...',
            nn: null,
            epochs: 10,
            monthFormatter: new Intl.DateTimeFormat('en', { month: 'long' })
        }
    },
    watch: {
        features() {
            this.init();
        },
        prediction() {
            this.init();
        }
    },
    mounted() {
        this.fetchData().then(this.init);
    },
    methods: {
        fetchData() {
            this.result = 'Loading data...';
            return fetch('https://crunchbase-explorer.web.app/data/companies.json')
                .then(response => response.json())
                .then(json => {
                    this.data = [];
                    json.companies.forEach(item => {
                        Object.keys(item).forEach(key => {
                            item[key] = this.convertValue(key, item[key]);
                        })
                        this.data.push(item);
                    })
                    this.reset();
                })
        },
        reset() {
            if (this.nn) {
                this.nn.dispose();
            }
            this.$nextTick(() => { // in case dispose takes a while...
                this.trained = false;
                this.inProgress = false;
                this.result = '';
            });
        },
        init() {
            this.reset();
            let nnOptions = {
                inputs: this.features,
                outputs: [this.prediction],
                task: 'classification',
                debug: true
            };
            this.nn = window.ml5.neuralNetwork(nnOptions)
        },
        formatKey(key) {
            return key.replace(/_/g,' ').replace(/([A-Z][a-z])/g, ' $1');
        },
        uniqueOpts(key) {
            const vals = this.data.map(item => item[key]);
            return [...new Set(vals)].filter(item => !!item);
        },
        triggerTrain() {
            this.trained = false;
            this.inProgress = true;
            this.result = 'Training...';
            this.data.forEach(item => {
                if (!this.features.concat(this.prediction).every(key => item[key])) {
                    return;
                }

                let data = {};
                this.features.forEach(key => {
                    data[key] = item[key];
                });
                this.nn.addData(data, {
                    [this.prediction]: item[this.prediction] || ''
                });
            })
            setTimeout(this.train, 100);
        },
        train() {
            try {
                this.nn.normalizeData();
                this.nn.train({
                    epochs: this.epochs
                }, this.whileTraining, this.finishedTraining);
            } catch(e) {
                this.result = e.toString();
                console.error(e);
            }
        },
        whileTraining(epoch, logs) {
            this.result = `Epoch: ${epoch+1} - loss: ${logs.loss.toFixed(2)}`;
        },
        finishedTraining() {
            this.trained = true;
            this.inProgress = false;
        },
        triggerPredict() {
            const inputs = this.features.map(key => this.inputs[key]);
            this.nn.classify(inputs, this.displayPrediction);
        },
        convertValue(key, val) {
            if (!val) {
                return '';
            }
            switch(key) {
                case 'total_funding_usd':
                    return Number(val);
                case 'headquarters':
                    return val.split(', ')[1] || '';
                case 'founded_date':
                    return this.monthFormatter.format(new Date(val));
                default:
                    return val;
            }
        },
        displayPrediction(err, results) {
            if (err) {
                this.result = err.toString();
            } else {
                this.result = `Prediction: ${results[0].label}`;
            }
        }
    }
}
</script>
<style>
body {
    margin: 2em;
}
button {
    margin: 1em 0;
}
label, option {
    text-transform: capitalize;
}
.predict-inputs {
    display: flex;
    justify-content: space-between;
    margin: 0.5em 0;
    width: 400px;
}
.predict-inputs select {
    width: 200px;
}
h3 {
    margin-bottom: 0.25em;
}
</style>