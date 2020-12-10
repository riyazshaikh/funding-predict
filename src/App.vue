<template>
    <div>
        <h1>Funding Prediction</h1>
        <div class="features">
            <h3>Input features</h3>
            <select v-model="features" multiple>
                <option
                    class="capitalize"
                    v-for="opt in featureOpts"
                    :key="opt"
                    :value="opt"
                >{{formatKey(opt)}}</option>
            </select>
            <h3>Predicted feature</h3>
            <select v-model="prediction">
                <option
                    class="capitalize"
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
            <h3>Most promising companies founded since {{yearFormatter.format(cutoffDate)}}</h3>
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
            yearFormatter: new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }),
            numFormatter: new Intl.NumberFormat('en-US', { notation: 'compact' }),
            features: ['sectors', 'funding_after', 'founded_month'],
            featureOpts: ['sectors', 'funding_after', 'founded_month'],
            prediction: 'series_b_plus',
            predictOpts: ['series_b_plus'],
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
                label: 'Sectors',
                field: 'sectors',
                tdClass: 'capitalize',
                formatFn: val => val ? val.map(this.formatKey).join(', ') : '',
                filterOptions: {
                    enabled: true,
                    filterDropdownItems: this.uniqueOpts('sectors', this.testingData)
                }
            }, {
                label: 'Seed Investors',
                field: 'seed_investor',
                tdClass: 'capitalize',
                formatFn: val => val ? val.map(this.formatKey).join(', ') : '',
                filterOptions: {
                    enabled: true,
                    filterDropdownItems: this.uniqueOpts('seed_investor', this.testingData)
                }
            }, {
                label: 'Series',
                field: 'series',
                formatFn: (val, obj) => obj.series ? obj.series.join(', ') : '',
                filterOptions: {
                    enabled: true,
                    filterDropdownItems: this.uniqueOpts('series', this.testingData)
                }
            }, {
                label: 'Probability of ' + this.formatKey(this.prediction),
                field: 'prediction',
                type: 'percentage'
            }]
        },
        sortOpts() {
            return {
                enabled: true,
                initialSortBy: {
                    field: 'prediction',
                    type: 'desc'
                }
            }
        }
    },
    watch: {
        features() {
            this.init();
        }
    },
    mounted() {
        this.fetchData().then(this.init);
    },
    methods: {
        fetchData() {
            this.result = 'Loading data...';
            return fetch('https://ventures-645.web.app/data/companies.json')
                .then(response => response.json())
                .then(this.processData);
        },
        processData(data) {
            data.forEach(item => {
                [...Object.keys(item), ...this.featureOpts, ...this.predictOpts].forEach(key => {
                    item[key] = this.convertValue(key, item);
                })
                if (item.total_funding_usd > 0) {
                    this.trainingData.push(item);
                } else if (item.founded_date > this.cutoffDate) {
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
                    let val = item[key];
                    set[key] = Array.isArray(val) ? val[val.length-1] || '' : val;
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
            this.result = `Epoch: ${epoch} - loss: ${logs.loss.toFixed(2)}`;
        },
        finishedTraining() {
            this.result = `Predicting ${this.testingData.length} data points...`;
            setTimeout(this.predict, 100); // Let dom update before intensive calculations
        },
        predict() {
            this.testingData.forEach(item => {
                const inputs = this.features.reduce((set, key) => {
                    const val = item[key];
                    set[key] = Array.isArray(val) ? val[val.length-1] || '' : val;
                    return set;
                }, {});
                try {
                    const results = this.nn.classifySync(inputs);
                    item.prediction = results.find(r => r.label == 'yes').confidence;
                } catch(e) {
                    this.result = e.toString();
                    console.error(e);
                }
            });
            this.predicted = true;
            this.inProgress = false;
            this.result = '';
            this.hideVisor();
        },
        convertValue(key, obj) {
            switch(key) {
                case 'founded_month':
                    return this.monthFormatter.format(new Date(obj.founded_date));
                case 'funding_after':
                    return Math.max(0, Math.min(Date.now(), Math.min(...obj.announced_on) - obj.founded_date))
                case 'series_b_plus':
                    return obj.series && obj.series.includes('B') ? 'yes' : 'no';
                case 'total_funding_usd':
                    return obj[key] || 0;
                default:
                    return obj[key] || '';
            }
        },
        hideVisor() {
            // Need to find a cleaner way
            document.querySelector('.visor-controls button:last-child').click();            
        },
        formatKey(key) {
            return key.replace(/[_\\-]/g,' ');
        },
        uniqueOpts(key, data) {
            const vals = data.map(item => item[key])
                            .filter(item => !!item)
                            .reduce((arr, item) => arr.concat(item), []);
            return [...new Set(vals)];
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
.capitalize {
    text-transform: capitalize;
}
h3 {
    margin-bottom: 0.25em;
}
</style>