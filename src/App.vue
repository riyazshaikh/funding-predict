<template>
    <div>
        <h1>Funding Prediction</h1>
        <div class="features">
            <h3>Input features</h3>
            <select v-model="features" multiple>
                <option
                    v-for="opt in featureOpts"
                    :key="opt"
                    :value="opt"
                >{{formatKey(opt)}}</option>
            </select>
            <h3>Predicted feature</h3>
            <select v-model="prediction">
                <option
                    v-for="opt in predictOpts"
                    :key="opt"
                    :value="opt"
                >{{formatKey(opt)}}</option>
            </select>
            <h3>Epochs to train</h3>
            <input type="number" v-model="epochs" />
        </div>
        <button
            v-if="features.length && prediction"
            @click="startTrain"
            :disabled="!trainingData || inProgress"
        >Train & Predict</button>
        <div class="result">{{result}}</div>        
        <div v-if="predicted">
            <h3>Predictions for companies founded in the past 24 months</h3>
            <vue-good-table
                :rows="testingData"
                :columns="displayCols"
                :pagination-options="pageOpts"
                :sort-options="sortOpts">
                <template slot="table-row" slot-scope="props">
                    <span v-if="props.column.field == 'name'">
                        <a
                            :href="'https://www.crunchbase.com/organization/' + props.row.permalink"
                            target=_blank
                        >{{props.row.name}}</a>
                    </span>
                </template>
            </vue-good-table>
        </div>
    </div>
</template>
<script>
import { VueGoodTable } from 'vue-good-table';
import 'vue-good-table/dist/vue-good-table.css';

export default {
    components: {
        VueGoodTable
    },
    data() {
        return {
            nn: null,
            predicted: false,
            inProgress: false,
            result: 'Loading...',
            epochs: 5,
            cutoffDate: new Date(2019,0,1).getTime(),
            monthFormatter: new Intl.DateTimeFormat('en', { month: 'long' }),
            yearFormatter: new Intl.DateTimeFormat('en', { year: 'numeric' }),
            numFormatter: new Intl.NumberFormat('en-US', { notation: 'compact' }),
            features: ['american', 'funding_after'],
            featureOpts: ['american', 'funding_after', 'founded_month'],
            prediction: 'series',
            predictOpts: ['series', 'funding_type', 'series_b_plus'],
            trainingData: [],
            testingData: [],
            pageOpts: {
                enabled: true
            }
        }
    },
    computed: {
        displayCols() {
            return [{
                label: 'Company',
                field: 'name',
                html: true,
                filterOptions: { enabled: true }
            }, {
                label: 'Headquarters',
                field: 'headquarters',
                filterOptions: { enabled: true }                
            }, {
                label: 'Founded',
                field: 'founded_date',
                formatFn: val => this.yearFormatter.format(new Date(val)),
                filterOptions: { enabled: true }
            }, {
                label: 'Funding',
                field: 'total_funding_usd',
                type: 'number',
                formatFn: val => '$' + this.numFormatter.format(val),
                filterOptions: { enabled: true }
            }, {
                label: 'Funding Type',
                field: 'funding_type',
                filterOptions: {
                    enabled: true,
                    filterDropdownItems: this.uniqueOpts('funding_type', this.testingData)
                }
            }, {
                label: 'Series',
                field: 'series',
                filterOptions: {
                    enabled: true,
                    filterDropdownItems: this.uniqueOpts('series', this.testingData)
                }
            }, {
                label: 'Series B Plus',
                field: 'series_b_plus',
                formatFn: (val, obj) => obj.series ? val : '',
                filterOptions: { enabled: true }
            }, {
                label: 'Prediction for ' + this.prediction,
                field: 'prediction',
                filterOptions: { enabled: true }            
            }]
        },
        sortOpts() {
            return {
                enabled: true,
                initialSortBy: {
                    field: this.prediction,
                    type: 'desc'
                }
            }
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
            return fetch('https://ventures-645.web.app/companies.json')
                .then(response => response.json())
                .then(this.processData);
        },
        processData(data) {
            data.forEach(item => {
                [...Object.keys(item), ...this.featureOpts, ...this.predictOpts].forEach(key => {
                    item[key] = this.convertValue(key, item);
                })
                if (!item.founded_date || !item.permalink || !item.series) {
                    return;
                }
                if (item.founded_date < this.cutoffDate) {
                    this.trainingData.push(item);
                } else {
                    this.testingData.push(item);
                }
            })
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
        reset() {
            if (this.nn) {
                this.nn.dispose();
            }
            this.$nextTick(() => { // in case dispose takes a while...
                this.predicted = false;
                this.inProgress = false;
                this.result = '';
            });
        },
        startTrain() {
            this.predicted = false;
            this.inProgress = true;
            this.trainingData.forEach(item => {
                let data = this.features.reduce((set, key) => {
                    set[key] = item[key];
                    return set;
                }, {});
                this.nn.addData(data, {
                    [this.prediction]: item[this.prediction]
                });
            })
            this.result = `Training on ${this.trainingData.length} data points...`;
            setTimeout(this.train, 100); // Let dom update before intensive calculations
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
            this.result = `Predicting ${this.testingData.length} data points...`;
            setTimeout(this.predict, 100); // Let dom update before intensive calculations
        },
        predict() {
            this.testingData.forEach(item => {
                const inputs = this.features.reduce((set, key) => {
                    set[key] = item[key];
                    return set;
                }, {});
                try {
                    const results = this.nn.classifySync(inputs);
                    item.prediction = results[0].label;
                } catch(e) {
                    this.result = e.toString();
                    console.error(e);
                }
            });
            this.predicted = true;
            this.inProgress = false;
            this.showAccuracy();
            this.hideVisor();
        },
        showAccuracy() {
            const accurate = this.testingData.filter(item => item.prediction == item[this.prediction]);
            const accuracy = (accurate.length / this.testingData.length * 100).toFixed(2);
            this.result = `Accuracy = ${accuracy}%`;
        },
        convertValue(key, obj) {
            switch(key) {
                case 'american':
                    // interpret 2 character ending as american state
                    return this.convertValue('state', obj).length == 2 ? 'yes' : 'no';
                case 'founded_month':
                    return this.monthFormatter.format(new Date(obj.founded_date));
                case 'funding_after':
                    return obj.announced_on - obj.founded_date;
                case 'series_b_plus':
                    return obj.series && obj.series.length == 1 && obj.series > 'B' ? 'yes' : 'no';
                case 'state':
                    return obj.headquarters && obj.headquarters.split(', ')[1] || '';
                case 'announced_on':
                case 'founded_date':
                case 'total_funding_usd':
                    return obj[key] ? Number(obj[key]) : 0;
                default:
                    return obj[key] || '';
            }
        },
        hideVisor() {
            // Need to find a cleaner way
            document.querySelector('.visor-controls button:last-child').click();            
        },
        formatKey(key) {
            return key.replace(/_/g,' ').replace(/([A-Z][a-z])/g, ' $1');
        },
        uniqueOpts(key, data) {
            const vals = data.map(item => item[key]);
            return [...new Set(vals)].filter(item => !!item);
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
h3 {
    margin-bottom: 0.25em;
}
</style>