import fs from 'fs'
import dotenv from 'dotenv'
import pg from 'pg'
import QueryStream from 'pg-query-stream'

// Load environment variables
dotenv.config();

let config = {
	database: process.env.DATABASE,
	host: process.env.HOSTNAME,
	user: process.env.USERNAME,
	password: process.env.PASSWORD
}
if (process.env.SSL_CA && process.env.SSL_KEY && process.env.SSL_CERT) {
	config.ssl = {
		rejectUnauthorized: false,
		ca: fs.readFileSync(process.env.SSL_CA).toString(),
		key: fs.readFileSync(process.env.SSL_KEY).toString(),
		cert: fs.readFileSync(process.env.SSL_CERT).toString()		
	}
}

const company_fields = [
	'name',
	'permalink',
	'sectors',
	'total_funding_usd',
	'founded_date',
	'headquarters'
].map(str => 'C1.' + str).join(',')

const funding_fields = [
	'announced_on',
	'series'
].map(str => 'C2.' + str).join(',')

const investor_fields = [
	'investor_permalink',
].map(str => 'C3.' + str).join(',')

// Select all organizations and join with fundings and investors
const query = `SELECT ${company_fields}, ${funding_fields}, ${investor_fields}
				FROM crunchbase_organizations C1
				LEFT JOIN crunchbase_funding_rounds C2
				ON C1.permalink = C2.startup_permalink
				LEFT JOIN crunchbase_funding_round_investors C3
				ON C3.funding_round_uuid = C2.uuid
				ORDER BY C1.permalink, C2.announced_on ASC`

// Fetch data as a stream and process via callbacks
const stream = async (opts = {}) => {
	const client = new pg.Client(config)
	try {
		await client.connect();
		const stream = client.query(new QueryStream(query));
		stream.on('data', opts.onData);
		stream.on('end', () => {
			client.end();
			opts.onEnd();
		});
	} catch(e) {
		console.error('error', e.stack);
		client.end();
	}
}

export default { stream }