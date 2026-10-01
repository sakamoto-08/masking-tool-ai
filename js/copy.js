/**
 * コピー用テキストの組み立て。
 * ON の対象は種別ごとのラベルに置換する（前後スペース付き）。
 * 例: [氏名] / [メール] / [電話番号] / [住所] / [企業名]
 * OFF なら元の文字列を残す。
 */

const MASK_LABELS = {
  person: "氏名",
  email: "メール",
  phone: "電話番号",
  address: "住所",
  company: "企業名",
};

function maskReplacementFor(type) {
  const label = MASK_LABELS[type] || "MASK";
  return " [" + label + "] ";
}

function buildMaskedText(tokens) {
  if (!Array.isArray(tokens)) {
    return "";
  }

  let result = "";
  for (const token of tokens) {
    if (!token || typeof token.value !== "string") {
      continue;
    }
    // ON なら種別ラベル、OFF なら元の文字列。
    if (isMaskableToken(token) && !token.disabled) {
      result += maskReplacementFor(token.type);
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
          dataType === "email" ||
          dataType === "address" ||
          dataType === "company" ||
          dataType === "person" ||
          dataType === "phone"
            ? dataType
            : "phone",
        value: node.textContent,
        disabled: node.classList.contains("disabled"),
      });
    }
  });
  return tokens;
}
