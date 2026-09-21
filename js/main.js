(function () {
  const textInput = document.getElementById("textInput");
  const textOutput = document.getElementById("textOutput");
  const detectButton = document.getElementById("detectButton");
  const copyButton = document.getElementById("copyButton");
  const statusMessage = document.getElementById("statusMessage");
  const EMPTY_OUTPUT_MESSAGE = "変換結果がここに表示されます。";

  if (!textInput || !textOutput || !detectButton || !copyButton) {
    return;
  }

  function setStatus(message, isError) {
    if (!statusMessage) {
      return;
    }
    statusMessage.textContent = message;
    statusMessage.hidden = !message;
    statusMessage.classList.toggle("is-error", Boolean(isError));
  }

  function showPlaceholder() {
    textOutput.replaceChildren(document.createTextNode(EMPTY_OUTPUT_MESSAGE));
  }

  detectButton.addEventListener("click", function () {
    renderHighlighted(textInput.value, textOutput);
    setStatus("");
  });

  textOutput.addEventListener("click", function (event) {
    const target = event.target;
    if (target && target.classList && target.classList.contains("highlight")) {
      toggleHighlightTarget(target);
    }
  });

  copyButton.addEventListener("click", function () {
    const copiedText = buildMaskedText(tokensFromOutputElement(textOutput));

    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      setStatus("この環境ではクリップボードへコピーできません。", true);
      return;
    }

    navigator.clipboard.writeText(copiedText).then(
      function () {
        setStatus("コピーしました。");
      },
      function () {
        setStatus("コピーに失敗しました。ブラウザの権限を確認してください。", true);
      }
    );
  });

  showPlaceholder();
})();
