import DataLoader from './loader.js'
import writeJsonFile from 'write-json-file'
import { FUNDING, TOP_LEVEL_TAGS, ALIAS_MAP } from './enums.js'

const MILLION = 1000 * 1000;
const TIME_2018 = new Date(2018,0,1).getTime();
const TIME_2000 = new Date(2000,0,1).getTime();

const invalid = row => {
	// Discard any company without permalink or older than 2000
	return !row.permalink || row.founded_date < TIME_2000
	// Discard any company that raised more than $7M
	|| row.total_funding_usd > 7 * MILLION
	// Discard any company that never raised AND was founded before 2018
	|| (row.total_funding_usd == 0 && row.founded_date < TIME_2018)
	// Discard any companies in pharma/biotech/blockchain
	|| ['biotech','blockchain','health care'].some(sector => row.sectors.includes(sector))
	// Discard any non-american companies (identified by 2 character states)
	|| row.state && row.state.length !== 2
	// Discard any company that raised non venture/seed funding
	|| row.series && row.series.length > 1 && ![FUNDING.NOTE, FUNDING.SEED, FUNDING.VENTURE].includes(row.series)
	// Discard any company that raised a round and then didn't raise for more than 30 months
	// TBD
}

const transform = row => {
	row.total_funding_usd = Number(row.total_funding_usd) || 0;
	// Extract state from headquarters
	row.state = (row.headquarters || '').split(', ')[1] || '';
	// Map sector aliases and filter out unrecognized sectors
	row.sectors = (row.sectors || '').split(', ')
						.map(sector => sector.toLowerCase())
						.map(sector => ALIAS_MAP[sector] || sector)
						.filter(sector => TOP_LEVEL_TAGS.includes(sector));
	row.sectors = [...new Set(row.sectors)];

	// Convert dates to timestamp
	['founded_date', 'announced_on'].forEach(key => {
		if (row[key]) {
			row[key] = new Date(row[key]).getTime();
		}
	})

	// Mark as seed or venture investor
	if ([FUNDING.SEED, FUNDING.NOTE].includes(row.series)) {
		row.seed_investor = row.investor_permalink;
	} else {
		row.venture_investor = row.investor_permalink;
	}
	delete row.investor_permalink;
	return row;
}

// Run
(async () => {
	let companies = {};
	DataLoader.stream({
		onData: row => {
			row = transform(row);
			if (invalid(row)) {
				return;
			}
			const key = row.permalink;
			// Add to map if not already there
			if (!companies[key]) {
				companies[key] = {
					...row
				}
			}
			// Flatten into array of unique values
			['announced_on', 'series', 'venture_investor', 'seed_investor'].forEach(field => {
				if (!Array.isArray(companies[key][field])) {
					companies[key][field] = companies[key][field] ? [companies[key][field]] : []
				}
				if (row[field] && !companies[key][field].includes(row[field])) {
					companies[key][field].push(row[field]);	
				}
			});
		},
		onEnd: async () => {
			const data = Object.values(companies);
			await writeJsonFile('dist/data/companies.json', data);
		}
	});
})();
