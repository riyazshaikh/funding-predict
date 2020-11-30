import fs from 'fs'
import dotenv from 'dotenv'
import pg from 'pg';

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
	'website',
	'regions',
	'sectors',
	'total_funding_usd',
	'number_of_investments',
	'founded_date',
	'headquarters'
].map(str => 'C1.' + str).join(',')
const funding_fields = [
	'startup_permalink',
	'funding_type',
	'series'
].map(str => 'C2.' + str).join(',')

// Select all organizations and join latest funding info
const query = `SELECT ${company_fields}, ${funding_fields} FROM crunchbase_organizations
				C1 LEFT JOIN crunchbase_funding_rounds C2
				ON C2.id = (SELECT id FROM crunchbase_funding_rounds C3
					WHERE C1.permalink = C3.startup_permalink ORDER BY C3.announced_on DESC LIMIT 1
				)`

// Fetch all the data needed
const fetch = async () => {
	const client = new pg.Client(config)
	try {
		await client.connect();
		const { rows: companies } = await client.query(query);
		return {
			companies
		}
	} catch(e) {
		console.error('error', e.stack);
	} finally {
		client.end();
	}
}

export default { fetch }