/**
 * 電話番号の検出とトークン分割。
 * 対象は現行仕様どおりハイフン区切りの \d{2,4}-\d{2,4}-\d{4} のみ。
 */

const PHONE_REGEX_SOURCE = "\\d{2,4}-\\d{2,4}-\\d{4}";

function createPhoneRegex() {
  return new RegExp(PHONE_REGEX_SOURCE, "g");
}

function detectPhoneNumbers(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }
  return text.match(createPhoneRegex()) || [];
}

/**
 * 入力文字列を通常テキストと電話番号に分割する。
 * @returns {{ type: "text" | "phone", value: string, disabled?: boolean }[]}
 */
function tokenizeText(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const tokens = [];
  const regex = createPhoneRegex();
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "phone", value: match[0], disabled: false });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}
