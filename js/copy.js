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
    // メール・住所も電話番号と同じルール: ON なら [MASK]、OFF なら元の文字列。
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
      const dataType = node.getAttribute("data-type");
      tokens.push({
        // highlight の data-type を優先。未知の値は従来どおり phone に倒す。
        type:
          dataType === "email" || dataType === "address" || dataType === "phone"
            ? dataType
            : "phone",
        value: node.textContent,
        disabled: node.classList.contains("disabled"),
      });
    }
  });
  return tokens;
}
