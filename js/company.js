/**
 * 日本の企業名・組織名の検出。
 * 法人格と名称が両方あるときだけ拾い、法人格だけ・一般単語だけでは検出しない。
 *
 * 対象例: 株式会社サンプル商事 / （株）テスト工業 / 合同会社ABCデザイン
 * 対象外: 株式会社 / サンプル / 商事
 *
 * 名称は漢字・カタカナ・英数字に限定する（「株式会社です」などを誤検出しないため）。
 */

const COMPANY_LEGAL_FORM_SOURCE =
  "特定非営利活動法人|公益社団法人|公益財団法人|一般社団法人|一般財団法人|" +
  "社会福祉法人|学校法人|NPO法人|" +
  "合同会社|合資会社|合名会社|有限会社|株式会社|" +
  "[（(]株[）)]|[（(]有[）)]|[（(]同[）)]|㈱|㈲";

// ひらがなは含めない。「と」「です」で名称を切る。
const COMPANY_NAME_CHAR = "\\u4E00-\\u9FFF\\u30A0-\\u30FFA-Za-z0-9々〆ヵヶー･・＆&";

const COMPANY_NAME_SOURCE = "[" + COMPANY_NAME_CHAR + "]{1,40}";

// 後株は2文字以上・スペースなし（「A 株式会社」のように直前の英字を名称と誤認しないため）。
const COMPANY_REGEX_SOURCE =
  "(?:" +
  COMPANY_LEGAL_FORM_SOURCE +
  ")[ 　]?" +
  COMPANY_NAME_SOURCE +
  "|" +
  "[" +
  COMPANY_NAME_CHAR +
  "]{2,40}(?:" +
  COMPANY_LEGAL_FORM_SOURCE +
  ")";

function createCompanyRegex() {
  return new RegExp(COMPANY_REGEX_SOURCE, "g");
}

const COMPANY_LEGAL_FORM_TEST = new RegExp(COMPANY_LEGAL_FORM_SOURCE);

// 法人格を除いた名称が残ること。法人格だけは落とす。
function isPlausibleCompanyName(value) {
  if (typeof value !== "string") {
    return false;
  }
  const formMatch = value.match(COMPANY_LEGAL_FORM_TEST);
  if (!formMatch) {
    return false;
  }
  const rest = value.split(formMatch[0]).join("").replace(/[ 　]/g, "");
  return rest.length >= 1;
}

function detectCompanyNames(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const found = [];
  const regex = createCompanyRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (isPlausibleCompanyName(match[0])) {
      found.push(match[0]);
    }
  }

  return found;
}
