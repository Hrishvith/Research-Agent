import { load } from 'cheerio';

const queries = [
  'machine learning',
  'machine learning research review',
  'machine systematic analysis',
  'recent advances in machine learning',
];

for (const query of queries) {
  const resp = await fetch(`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&num=10`, {
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
  console.log('QUERY', query, 'COUNT', titles.length, 'FIRST', titles.slice(0, 3).join(' | '));
}
