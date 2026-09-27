/**
 * コピー用テキストの組み立て。
 * ON（マスク対象）は現行どおり前後スペース付きの " [MASK] " に置換する。
 */

const MASK_REPLACEMENT = " [MASK] ";

function buildMaskedText(tokens) {
  if (!Array.isArray(tokens)) {
    return "";
  }

  let result = "";
  for (const token of tokens) {
    if (!token || typeof token.value !== "string") {
      continue;
    }
    // メールも電話番号と同じルール: ON なら [MASK]、OFF なら元の文字列。
    if (isMaskableToken(token) && !token.disabled) {
      result += MASK_REPLACEMENT;
    } else {
      result += token.value;
    }
  }
  return result;
}

function tokensFromOutputElement(container) {
  if (!container) {
    return [];
  }

  const tokens = [];
  container.childNodes.forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      tokens.push({ type: "text", value: node.textContent });
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      node.classList.contains("highlight")
    ) {
      tokens.push({
        type: node.getAttribute("data-type") === "email" ? "email" : "phone",
        value: node.textContent,
        disabled: node.classList.contains("disabled"),
      });
    }
  });
  return tokens;
}
