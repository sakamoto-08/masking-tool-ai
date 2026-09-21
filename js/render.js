/**
 * 検出結果の描画。ユーザー入力は textContent / createTextNode のみで扱う。
 * innerHTML は使わない（入力中の HTML を実行しないため）。
 */

function renderHighlighted(text, container) {
  if (!container) {
    return;
  }

  const tokens = tokenizeText(text);
  const fragment = document.createDocumentFragment();

  for (const token of tokens) {
    if (token.type === "phone") {
      const span = document.createElement("span");
      span.className = "highlight";
      span.textContent = token.value;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(token.value));
    }
  }

  container.replaceChildren(fragment);
}

function toggleHighlightTarget(element) {
  if (!element || !element.classList.contains("highlight")) {
    return;
  }
  element.classList.toggle("disabled");
}
