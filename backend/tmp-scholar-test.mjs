import { load } from 'cheerio';

const resp = await fetch('https://scholar.google.com/scholar?q=machine+learning&hl=en&num=10', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://scholar.google.com/',
  },
});
const html = await resp.text();
const $ = load(html);
const titles = [];
$('div.gs_ri').each((i, el) => {
  const title = $(el).find('h3 a').first().text().trim();
  if (title) titles.push(title);
});
console.log(JSON.stringify({ status: resp.status, count: titles.length, titles: titles.slice(0, 10) }, null, 2));
