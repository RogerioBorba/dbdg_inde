import type { PageLoad } from './$types';
import { readFileSync } from 'fs';

export const load: PageLoad = ({ params }) => {
	const path = 'C:/dados/xml/books.xml';
  	const xmlContent = readFileSync(path, 'utf-8');
	console.log(xmlContent);
	return {
		xmlContent
	};
};