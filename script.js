import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync, readdirSync } from 'fs';
import fetch from 'node-fetch';

// is.html の URL を assets/ 直下の html ファイルから抜き出す
const urls = readdirSync('./assets')
    .map((htmlFileName) => {
      const text = readFileSync(`./assets/${htmlFileName}`, 'utf8');
      // Set オブジェクトへの変換による重複排除
      const urls
          = Array.from(new Set(text.match(/https:\/\/job\.mynavi\.jp\/24\/pc\/search\/corp.*?\/is\.html/g)));
      return urls;
    }).flat();

// csv-writer の初期化・カラムの設定
const csvWriter = createObjectCsvWriter({
  path: './result.csv',
  header: [
      {id: 'company', title: '会社名'},
      {id: 'email', title: 'メールアドレス'},
      {id: 'contact', title: '連絡先'},
      {id: 'url', title: 'マイナビURL'},
  ]
});

(async () => {
  const responseArray = await Promise.all(urls.map((url) => fetch(url)));
  // インターンシップページの html テキスト
  const htmlTexts = await Promise.all(responseArray.map((res) => res.text()));
  // インターンシップ詳細ページの URL
  const internshipUrls = htmlTexts.map((text) => {
    const matchArray
        = text.match(/(\/24\/pc\/corpinfo\/displayInternship\/index\?corpId=.*?&optNo=.*?)&"/);
    if (!matchArray) return null;
    if (!matchArray[1]) return null;
    // &" を含まない部分の最初のグループを抽出
    return `https://job.mynavi.jp${matchArray[1]}`;
  // null を弾く
  }).filter((url) => url);

  const internshipResponseArray
      = await Promise.all(internshipUrls.map((url) => fetch(url)));
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
})();
