import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync, readdirSync } from 'fs';
import { url } from 'inspector';
import fetch from 'node-fetch';

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
const urls = corpIds.map(
  (corpId) => `https://job.mynavi.jp/24/pc/search/corp${corpId}/is.html`
);

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

const fetchInternshipDetailPage = async (
  internshipPageHtmlTexts: string[]
): Promise<string[]> => {
  const urls = internshipPageHtmlTexts
    .map((text) => {
      const matchArray =
        /(\/24\/pc\/corpinfo\/displayInternship\/index\?corpId=.*?&optNo=.*?)&"/.exec(
          text
        );
      if (!matchArray) return null;
      if (!matchArray[1]) return null;
      // &" を含まない部分の最初のグループを抽出
      return `https://job.mynavi.jp${matchArray[1]}`;
      // Null を弾く
    })
    .filter((url) => url) as string[];
  
  const responses = (
    await Promise.all(urls.map(async (url) => fetch(url).catch(() => null)))
  ).filter((res) => res) as Response[];
  // インターンシップ詳細ページの html テキスト
  const htmlTexts = await Promise.all(responses.map(async (res) => res.text()));
  return htmlTexts;
};

(async () => {
  const internshipPageResponseArray = (
    await Promise.all(urls.map(async (url) => fetch(url).catch(() => null)))
  ).filter((res) => res) as Response[];
  // インターンシップページの html テキスト
  const internshipPageHtmlTexts = await Promise.all(
    internshipPageResponseArray.map(async (res) => res.text())
  );

  console.log(internshipPageHtmlTexts.length)

  // const internshipDetailPageHtmlTexts = await fetchInternshipDetailPage(internshipPageHtmlTexts);

  /*
  Const internshipResponseArray
      = (await Promise.all(internshipUrls.map(((url) => fetch(url).catch(() => null))))).filter((res) => res);
  // インターンシップ詳細ページの html テキスト
  const internshipHtmlTexts
      = await Promise.all(internshipResponseArray.map((res) => res.text()));

  const records = internshipHtmlTexts.map((text, i) => {
    const url = internshipUrls[i];
    // h1　に社名が入っている
    const companyMatchArray = text.match(/<h1>(.*?)<\/h1>/);
    if (!companyMatchArray) return null;
    if (!companyMatchArray[1]) return null;
    const company = companyMatchArray[1];
    const contactMatchArray
        = text.match(/<td class="sameSize" id="inquiry">(.*?)<\/td>/);
    if (!contactMatchArray) return null;
    if (!contactMatchArray[1]) return null;
    // csv が壊れないように , は消す
    // <br /> は消す
    const contact = contactMatchArray[1].replaceAll('<br/>', ' ').replaceAll(',', ' ');
    const emailMatchArray = contact.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/);
    if (!emailMatchArray) return null;
    const email = emailMatchArray[0];
    return { company, email, contact, url };
  // null を弾く
  }).filter((record) => record);

  await csvWriter.writeRecords(records);
  */
})();
