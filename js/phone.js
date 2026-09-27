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

function isMaskableToken(token) {
  return Boolean(token && (token.type === "phone" || token.type === "email"));
}

function collectPhoneMatches(text) {
  const matches = [];
  const regex = createPhoneRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({ type: "phone", value: match[0], index: match.index });
  }

  return matches;
}

// メール検出は email.js。未読み込みでも電話番号の tokenize は動かす。
function collectEmailMatches(text) {
  if (typeof createEmailRegex !== "function" || typeof isPlausibleEmail !== "function") {
    return [];
  }

  const matches = [];
  const regex = createEmailRegex();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (isPlausibleEmail(match[0])) {
      matches.push({ type: "email", value: match[0], index: match.index });
    }
  }

  return matches;
}

// 重なるときは開始位置が早い方、同じ位置なら長い方、さらにメールを優先する。
function mergeMaskableMatches(matches) {
  const sorted = matches.slice().sort(function (a, b) {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    if (a.value.length !== b.value.length) {
      return b.value.length - a.value.length;
    }
    if (a.type === "email" && b.type !== "email") {
      return -1;
    }
    if (b.type === "email" && a.type !== "email") {
      return 1;
    }
    return 0;
  });

  const accepted = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const currentEnd = current.index + current.value.length;
    const overlaps = accepted.some(function (prev) {
      const prevEnd = prev.index + prev.value.length;
      return current.index < prevEnd && currentEnd > prev.index;
    });
    if (!overlaps) {
      accepted.push(current);
    }
  }
  return accepted;
}

/**
 * 入力文字列を通常テキストと、電話番号・メールに分割する。
 * 既存の tokenize → render → copy の流れは変えず、メールを同じトークン列に載せる。
 * @returns {{ type: "text" | "phone" | "email", value: string, disabled?: boolean }[]}
 */
function tokenizeText(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const matches = mergeMaskableMatches(
    collectPhoneMatches(text).concat(collectEmailMatches(text))
  );
  const tokens = [];
  let lastIndex = 0;

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    tokens.push({ type: match.type, value: match.value, disabled: false });
    lastIndex = match.index + match.value.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}
