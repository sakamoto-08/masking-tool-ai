/**
 * 電話番号の検出とトークン分割。
 *
 * ハイフンあり: 既存どおり \d{2,4}-\d{2,4}-\d{4}
 *   例: 03-1234-5678 / 06-1234-5678 / 090-1234-5678
 *
 * ハイフンなし（強化）:
 *   - 11桁の携帯・IP電話: 050/060/070/080/090 + 8桁（例: 09012345678）
 *   - 10桁の固定電話: 0 + 9桁。03/06 を含む（例: 0312345678）
 *
 * ハイフンなしは前後が数字だとマッチしない（長い数字列の一部を誤検出しないため）。
 * 10桁は 0[5-9]0 始まりを除く（欠けた11桁携帯を固定電話と誤認しないため）。
 */

// 既存のハイフン区切りを先に置く。ハイフンなしは11桁を10桁より前にし、部分一致を避ける。
const PHONE_REGEX_SOURCE =
  "\\d{2,4}-\\d{2,4}-\\d{4}" +
  "|" +
  "(?<!\\d)0[5-9]0\\d{8}(?!\\d)" +
  "|" +
  "(?<!\\d)0(?![5-9]0)\\d{9}(?!\\d)";

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
