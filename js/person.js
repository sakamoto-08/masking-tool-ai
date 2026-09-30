/**
 * 日本語の個人名（姓名）の検出。
 * よくある姓と名が連続しているときだけ拾い、姓だけ・名だけ・一般単語は検出しない。
 *
 * 対象例: 山田太郎 / 佐藤花子 / 鈴木一郎
 * 対象外: 山田 / 太郎 / 東京 / 会社 / サンプル / 商事 / 株式会社
 *
 * 名は2文字以上に限定する（「田中」を 田+中 と誤認しないため）。
 * 前後が漢字のときはマッチしない（住所や企業名の一部を飲み込まないため）。
 */

const PERSON_SURNAMES = [
  "長谷川",
  "佐々木",
  "高橋",
  "渡辺",
  "伊藤",
  "山本",
  "中村",
  "小林",
  "加藤",
  "吉田",
  "山田",
  "佐藤",
  "鈴木",
  "田中",
  "山口",
  "松本",
  "井上",
  "木村",
  "斎藤",
  "齋藤",
  "齊藤",
  "清水",
  "山崎",
  "阿部",
  "池田",
  "橋本",
  "山下",
  "石川",
  "中島",
  "前田",
  "藤田",
  "小川",
  "岡田",
  "後藤",
  "村上",
  "近藤",
  "石井",
  "坂本",
  "遠藤",
  "青木",
  "藤井",
  "西村",
  "福田",
  "太田",
  "三浦",
  "岡本",
  "松田",
  "中川",
  "中野",
  "原田",
  "小野",
  "田村",
  "竹内",
  "金子",
  "和田",
  "中山",
  "石田",
  "上田",
  "森田",
  "内田",
  "柴田",
  "酒井",
  "宮崎",
  "横山",
  "高木",
  "安藤",
  "宮本",
  "大野",
  "工藤",
  "今井",
  "谷口",
  "丸山",
  "高田",
  "河野",
  "藤本",
  "木下",
  "野村",
  "菊地",
  "菊池",
  "新井",
  "杉山",
  "千葉",
  "村田",
  "増田",
  "小山",
  "久保",
  "佐野",
  "大塚",
  "平野",
  "野口",
  "松井",
  "菅原",
  "岩田",
  "武田",
  "上野",
  "杉本",
  "古川",
  "村山",
  "大西",
  "島田",
  "水野",
  "高野",
  "桜井",
  "西田",
  "菊池",
  "森",
  "林",
  "原",
];

const PERSON_GIVEN_NAMES = [
  "久美子",
  "太郎",
  "次郎",
  "三郎",
  "一郎",
  "花子",
  "美子",
  "幸子",
  "恵子",
  "陽子",
  "和子",
  "由美",
  "美咲",
  "結衣",
  "陽菜",
  "美月",
  "優子",
  "香織",
  "美穂",
  "智子",
  "裕子",
  "直子",
  "明美",
  "愛美",
  "奈々",
  "沙織",
  "里奈",
  "亜美",
  "千尋",
  "美香",
  "健太",
  "大輔",
  "翔太",
  "拓也",
  "直樹",
  "翔平",
  "大輝",
  "康平",
  "達也",
  "和也",
  "哲也",
  "雄一",
  "健一",
  "智也",
  "悠真",
  "陽太",
  "海斗",
  "颯太",
  "悠人",
  "陽斗",
  "涼太",
  "真由",
];

// 地名や一般単語と一致し得る組み合わせは明示的に落とす。
const PERSON_DENYLIST = {
  東京: true,
  京都: true,
  大阪: true,
  名古屋: true,
  横浜: true,
  札幌: true,
  福岡: true,
  会社: true,
  商事: true,
  サンプル: true,
  株式会社: true,
};

function uniqueSortedByLength(items) {
  const seen = {};
  const unique = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!seen[item]) {
      seen[item] = true;
      unique.push(item);
    }
  }
  unique.sort(function (a, b) {
    return b.length - a.length;
  });
  return unique;
}

const PERSON_SURNAMES_SORTED = uniqueSortedByLength(PERSON_SURNAMES);
const PERSON_GIVEN_NAMES_SORTED = uniqueSortedByLength(PERSON_GIVEN_NAMES);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PERSON_SURNAME_SOURCE = PERSON_SURNAMES_SORTED.map(escapeRegExp).join("|");
const PERSON_GIVEN_NAME_SOURCE = PERSON_GIVEN_NAMES_SORTED.map(escapeRegExp).join(
  "|"
);

const PERSON_REGEX_SOURCE =
  "(?<![\\u4E00-\\u9FFF])(?:" +
  PERSON_SURNAME_SOURCE +
  ")(?:" +
  PERSON_GIVEN_NAME_SOURCE +
  ")(?![\\u4E00-\\u9FFF])";

function createPersonRegex() {
  return new RegExp(PERSON_REGEX_SOURCE, "g");
}

function startsWithListedSurname(value) {
  for (let i = 0; i < PERSON_SURNAMES_SORTED.length; i += 1) {
    if (value.indexOf(PERSON_SURNAMES_SORTED[i]) === 0) {
      return PERSON_SURNAMES_SORTED[i];
    }
  }
  return "";
}

// 姓と名の両方が辞書にあり、姓だけ・名だけではないこと。
function isPlausiblePersonName(value) {
  if (typeof value !== "string" || value.length < 3) {
    return false;
  }
  if (PERSON_DENYLIST[value]) {
    return false;
  }
  const surname = startsWithListedSurname(value);
  if (!surname) {
    return false;
  }
  const given = value.slice(surname.length);
  if (given.length < 2) {
    return false;
  }
  return PERSON_GIVEN_NAMES.indexOf(given) !== -1;
}

function detectPersonNames(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const found = [];
  const regex = createPersonRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (isPlausiblePersonName(match[0])) {
      found.push(match[0]);
    }
  }

  return found;
}
