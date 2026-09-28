/**
 * 日本の住所の検出。
 * 完全な住居表示ではなく、よくある「都道府県 + 市区町村 + 町名/番地」に限定する。
 *
 * 対象例: 東京都渋谷区道玄坂1-2-3 / 大阪府大阪市北区梅田1丁目2番3号
 * 対象外: 都道府県名だけ、市区町村だけ、番地だけ
 */

const PREFECTURE_SOURCE =
  "北海道|東京都|京都府|大阪府|" +
  "(?:青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|神奈川|" +
  "新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|" +
  "滋賀|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|" +
  "徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)県";

// 市区町村名。漢字・かなのみ（数字や「と」「です」を飲み込まない）。
const JP_NAME_CHAR = "\\u4E00-\\u9FFF\\u3040-\\u309F\\u30A0-\\u30FF々〆ヵヶ";

// 番地はハイフン区切りか、丁目/番/号/条を含むものだけ（1 だけの数字は拾わない）。
const ADDRESS_NUMBER_SOURCE =
  "(?:" +
  "[東西南北]?\\d+(?:[-−‐ー－]\\d+)+" +
  "|" +
  "[東西南北]?\\d+(?:丁目|番地|番|号|条)" +
  "(?:[東西南北]?\\d+(?:[-−‐ー－]\\d+)*(?:丁目|番地|番|号|条)?)*" +
  ")+";

const ADDRESS_REGEX_SOURCE =
  "(?:" +
  PREFECTURE_SOURCE +
  ")" +
  "(?:[" +
  JP_NAME_CHAR +
  "]{1,10}郡)?" +
  "(?:[" +
  JP_NAME_CHAR +
  "]{1,10}(?:市|区|町|村))+" +
  "(?:[" +
  JP_NAME_CHAR +
  "A-Za-z]{1,20})?" +
  ADDRESS_NUMBER_SOURCE;

function createAddressRegex() {
  return new RegExp(ADDRESS_REGEX_SOURCE, "g");
}

// 正規表現で拾ったあと、部品が欠けたものを落とす。
function isPlausibleAddress(value) {
  if (typeof value !== "string") {
    return false;
  }
  if (!/(北海道|都|府|県)/.test(value)) {
    return false;
  }
  if (!/(市|区|町|村)/.test(value)) {
    return false;
  }
  if (!/\d/.test(value)) {
    return false;
  }
  return true;
}

function detectAddresses(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const found = [];
  const regex = createAddressRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (isPlausibleAddress(match[0])) {
      found.push(match[0]);
    }
  }

  return found;
}
