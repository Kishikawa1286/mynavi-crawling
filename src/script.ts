import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync, readdirSync } from 'fs';
import fetch from 'node-fetch';

import { sequentialExcution } from './sqeMap.js';

// corpId を会社概要ページから抜き出す
// Set への変換で唯一性担保
const corpIds = Array.from(
  new Set(
    readdirSync('./assets')
      .map((htmlFileName) => {
        const text = readFileSync(`./assets/${htmlFileName}`, 'utf8');
        const matchArrays = text.matchAll(
          /https:\/\/job\.mynavi\.jp\/24\/pc\/search\/corp(.*?)\/outline\.html/g
        );
        if (!matchArrays) return [];
        return Array.from(matchArrays).map((matchArray) => matchArray[1]);
      })
      .flat()
  )
);
const internshipPageUrls = corpIds.map(
  (corpId) => `https://job.mynavi.jp/24/pc/search/corp${corpId}/is.html`
);

type RecordRow = {
  company: string;
  email: string;
  contact: string;
  url: string;
};

// Csv-writer の初期化・カラムの設定
const csvWriter = createObjectCsvWriter({
  path: './result2.csv',
  header: [
    { id: 'company', title: '会社名' },
    { id: 'email', title: 'メールアドレス' },
    { id: 'contact', title: '連絡先' },
    { id: 'url', title: 'マイナビURL' }
  ]
});

type PageData = {
  text: string;
  url: string;
};

const fetchPage = async (url: string) => {
  try {
    console.log(`Fetching ${url}`);
    const res = await fetch(url);
    const text = await res.text();
    return { text, url };
  } catch (e) {
    return null;
  }
};

const fetchPages = async (urls: string[]) => {
  return (await sequentialExcution(urls, fetchPage, 200)).filter(
    (item) => item
  ) as PageData[];
};

const fetchInternshipDetailPage = async (
  internshipPageHtmlTexts: string[]
): Promise<PageData[]> => {
  const urls = internshipPageHtmlTexts
    .map((text) => {
      const matchArray =
        /(\/24\/pc\/corpinfo\/displayInternship\/index\?corpId=.*?optNo=.*?)"/.exec(
          text
        );
      if (!matchArray) return null;
      if (!matchArray[1]) return null;
      return `https://job.mynavi.jp${matchArray[1].replace('amp;', '')}`;
    })
    // Null を弾く
    .filter((url) => url) as string[];

  console.log(urls);

  return (await Promise.all(urls.map(async (url) => fetchPage(url)))).filter(
    (pageData) => pageData
  ) as PageData[];
};

(async () => {
  const internshipPageHtmlTexts = await fetchPages(internshipPageUrls);

  const internshipDetailPageHtmlTexts = await fetchInternshipDetailPage(
    internshipPageHtmlTexts.map((pageData) => pageData.text)
  );

  const records = internshipDetailPageHtmlTexts
    .map((pageData) => {
      const { text, url } = pageData;
      // h1　に社名が入っている
      const companyMatchArray = /<h1>(.*?)<\/h1>/.exec(text);
      if (!companyMatchArray) return null;
      if (!companyMatchArray[1]) return null;
      const company = companyMatchArray[1];
      const contactMatchArray =
        /<td class="sameSize" id="inquiry">(.*?)<\/td>/.exec(text);
      if (!contactMatchArray) return null;
      if (!contactMatchArray[1]) return null;
      // csv が壊れないように , は消す
      // <br /> は消す
      const contact = contactMatchArray[1]
        .replace('<br/>', ' ')
        .replace(',', ' ');
      const emailMatchArray = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/.exec(contact);
      if (!emailMatchArray) return null;
      const email = emailMatchArray[0];
      return { company, email, contact, url };
      // null を弾く
    })
    .filter((record) => record) as RecordRow[];

  await csvWriter.writeRecords(records);
})();
