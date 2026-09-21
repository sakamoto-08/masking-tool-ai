/**
 * ブラウザで tests/run.html を開いて実行する。
 * npm やビルドツールは使わない。
 */

function runPhoneTests() {
  const results = [];

  function assertEqual(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({
      name: name,
      pass: pass,
      actual: actual,
      expected: expected,
    });
  }

  function assertTrue(name, value) {
    results.push({
      name: name,
      pass: Boolean(value),
      actual: value,
      expected: true,
    });
  }

  assertEqual(
    "ハイフン付き番号を検出する",
    detectPhoneNumbers("連絡先は 03-1234-5678 です"),
    ["03-1234-5678"]
  );

  assertEqual(
    "ハイフンなし番号は検出しない",
    detectPhoneNumbers("09012345678"),
    []
  );

  assertEqual(
    "空文字は空配列を返す",
    detectPhoneNumbers(""),
    []
  );

  assertEqual(
    "複数の番号を検出する",
    detectPhoneNumbers("03-1234-5678 と 090-1234-5678"),
    ["03-1234-5678", "090-1234-5678"]
  );

  const tokens = tokenizeText("A 03-1234-5678 B");
  assertEqual("トークン分割の件数", tokens.length, 3);
  assertEqual("先頭は通常テキスト", tokens[0], { type: "text", value: "A " });
  assertEqual("電話番号トークン", tokens[1].type, "phone");
  assertEqual("電話番号の値", tokens[1].value, "03-1234-5678");
  assertEqual("末尾は通常テキスト", tokens[2], { type: "text", value: " B" });

  assertEqual(
    "ONの番号は [MASK] に置換する",
    buildMaskedText([
      { type: "text", value: "番号:" },
      { type: "phone", value: "03-1234-5678", disabled: false },
    ]),
    "番号: [MASK] "
  );

  assertEqual(
    "OFFの番号は元のまま残す",
    buildMaskedText([
      { type: "text", value: "番号:" },
      { type: "phone", value: "03-1234-5678", disabled: true },
    ]),
    "番号:03-1234-5678"
  );

  const htmlInput = '<script>alert(1)</script> 03-1234-5678';
  const htmlTokens = tokenizeText(htmlInput);
  assertTrue(
    "HTMLタグは通常テキストとして残る",
    htmlTokens[0].type === "text" && htmlTokens[0].value.indexOf("<script>") !== -1
  );

  if (typeof document !== "undefined") {
    const mount = document.createElement("div");
    renderHighlighted('<script>alert(1)</script> 03-1234-5678', mount);
    assertTrue("script要素は生成されない", mount.querySelector("script") === null);
    assertTrue(
      "入力したタグは文字として残る",
      mount.textContent.indexOf("<script>alert(1)</script>") !== -1
    );
    assertTrue("電話番号はハイライトされる", mount.querySelector(".highlight") !== null);

    const phoneSpan = mount.querySelector(".highlight");
    toggleHighlightTarget(phoneSpan);
    assertTrue("クリック相当でOFFになる", phoneSpan.classList.contains("disabled"));

    const copied = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("OFF時のコピーは元番号を含む", copied.indexOf("03-1234-5678") !== -1);
    assertTrue("OFF時のコピーはMASKしない", copied.indexOf("[MASK]") === -1);

    toggleHighlightTarget(phoneSpan);
    const masked = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("ON時のコピーはMASKする", masked.indexOf(" [MASK] ") !== -1);
  }

  return results;
}
