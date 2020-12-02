import DataLoader from './loader.js'
import writeJsonFile from 'write-json-file'

(async () => {
	let data = await DataLoader.fetch();
	data.forEach(item => {
		['founded_date', 'announced_on'].forEach(key => {
			if (item[key]) {
				item[key] = new Date(item[key]).getTime();
			}
		})
	})
	await writeJsonFile('dist/companies.json', data);
})();
