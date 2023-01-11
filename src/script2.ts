import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const csv1 = parse(readFileSync('./result.csv', 'utf8')) as string[][];
const csv2 = parse(readFileSync('./result2.csv', 'utf8')) as string[][];

const csvWriter = createObjectCsvWriter({
  path: './result3.csv',
  header: [
    { id: 'company', title: '会社名' },
    { id: 'email', title: 'メールアドレス' },
    { id: 'contact', title: '連絡先' },
    { id: 'url', title: 'マイナビURL' }
  ]
});

(async () => {
  const companies1 = csv1.map((row) => row[0]);
  const records = csv2
    .filter((row) => !companies1.some((company) => row[0] === company))
    .map((row) => {
      return { company: row[0], email: row[1], contact: row[2], url: row[3] };
    });
  await csvWriter.writeRecords(records);
})();
