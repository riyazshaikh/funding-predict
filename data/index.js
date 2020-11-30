import DataLoader from './loader.js'
import writeJsonFile from 'write-json-file'

(async () => {
	const data = await DataLoader.fetch();
	await writeJsonFile('companies.json', data);
})();
