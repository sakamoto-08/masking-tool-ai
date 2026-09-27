/**
 * メールアドレスの検出。
 * RFC 完全準拠ではなく、よくある形に限定して誤検出を減らす。
 *
 * 対象例: test@example.com / user.name+tag@example.co.jp
 * 対象外: @がない、local/domain が欠けている、連続ドット、TLD がない
 */

// 前後がメール部品になり得る文字だとマッチしない（隣接した記号列の一部を拾わないため）。
const EMAIL_REGEX_SOURCE =
  "(?<![A-Za-z0-9._%+-])" +
  "[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?" +
  "@" +
  "(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+" +
  "[A-Za-z]{2,}" +
  "(?![A-Za-z0-9._%+-])";

function createEmailRegex() {
  return new RegExp(EMAIL_REGEX_SOURCE, "g");
}

// 正規表現で拾ったあと、明らかにおかしい形を落とす。
function isPlausibleEmail(value) {
  if (typeof value !== "string") {
    return false;
  }
  if (value.indexOf("..") !== -1) {
    return false;
  }
  const parts = value.split("@");
  if (parts.length !== 2) {
    return false;
  }
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) {
    return false;
  }
  if (domain.indexOf(".") === -1) {
    return false;
  }
  return true;
}

function detectEmailAddresses(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const found = [];
  const regex = createEmailRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (isPlausibleEmail(match[0])) {
      found.push(match[0]);
    }
  }

  return found;
}
