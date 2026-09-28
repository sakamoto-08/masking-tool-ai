/**
 * 日本の住所検出のテスト。
 * ブラウザで tests/run.html を開いて実行する。
 */

function runAddressTests() {
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
    "東京都の住所を検出する",
    detectAddresses("東京都渋谷区道玄坂1-2-3"),
    ["東京都渋谷区道玄坂1-2-3"]
  );

  assertEqual(
    "大阪府の住所（丁目番号）を検出する",
    detectAddresses("大阪府大阪市北区梅田1丁目2番3号"),
    ["大阪府大阪市北区梅田1丁目2番3号"]
  );

  assertEqual(
    "北海道の住所（条丁目）を検出する",
    detectAddresses("北海道札幌市中央区北1条西2丁目"),
    ["北海道札幌市中央区北1条西2丁目"]
  );

  assertEqual(
    "京都府の住所を検出する",
    detectAddresses("京都府京都市中京区寺町1-2-3"),
    ["京都府京都市中京区寺町1-2-3"]
  );

  assertEqual(
    "文章中の住所を検出する",
    detectAddresses("連絡先は東京都新宿区西新宿2-8-1と test@example.com です"),
    ["東京都新宿区西新宿2-8-1"]
  );

  assertEqual(
    "空文字は空配列を返す（住所）",
    detectAddresses(""),
    []
  );

  assertEqual(
    "都道府県名だけでは検出しない",
    detectAddresses("東京"),
    []
  );

  assertEqual(
    "市区町村だけでは検出しない",
    detectAddresses("渋谷区"),
    []
  );

  assertEqual(
    "番地だけでは検出しない",
    detectAddresses("1-2-3"),
    []
  );

  const tokens = tokenizeText("A 東京都渋谷区道玄坂1-2-3 B");
  assertEqual("住所のトークン件数", tokens.length, 3);
  assertEqual("住所は address トークン", tokens[1], {
    type: "address",
    value: "東京都渋谷区道玄坂1-2-3",
    disabled: false,
  });

  const mixed = tokenizeText(
    "連絡先は東京都新宿区西新宿2-8-1と test@example.com です"
  );
  const mixedTargets = mixed.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("住所とメールが混在しても件数は2つの対象", mixedTargets.length, 2);
  assertEqual("混在時も住所トークンを残す", mixedTargets[0], {
    type: "address",
    value: "東京都新宿区西新宿2-8-1",
    disabled: false,
  });
  assertEqual("混在時もメールトークンを残す", mixedTargets[1], {
    type: "email",
    value: "test@example.com",
    disabled: false,
  });

  const withPhone = tokenizeText(
    "東京都渋谷区道玄坂1-2-3 と 03-1234-5678"
  );
  const withPhoneTargets = withPhone.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("住所と電話が混在しても件数は2つの対象", withPhoneTargets.length, 2);
  assertEqual("混在時も電話番号トークンを残す", withPhoneTargets[1], {
    type: "phone",
    value: "03-1234-5678",
    disabled: false,
  });

  assertEqual(
    "住所ONは [MASK] に置換する",
    buildMaskedText([
      { type: "text", value: "住所:" },
      { type: "address", value: "東京都渋谷区道玄坂1-2-3", disabled: false },
    ]),
    "住所: [MASK] "
  );

  assertEqual(
    "住所OFFは元のまま残す",
    buildMaskedText([
      { type: "text", value: "住所:" },
      { type: "address", value: "東京都渋谷区道玄坂1-2-3", disabled: true },
    ]),
    "住所:東京都渋谷区道玄坂1-2-3"
  );

  if (typeof document !== "undefined") {
    const mount = document.createElement("div");
    renderHighlighted("東京都渋谷区道玄坂1-2-3", mount);
    const addressSpan = mount.querySelector(".highlight");
    assertTrue("住所はハイライトされる", addressSpan !== null);
    assertTrue(
      "住所の表示値",
      addressSpan !== null && addressSpan.textContent === "東京都渋谷区道玄坂1-2-3"
    );
    assertTrue(
      "住所の data-type",
      addressSpan !== null && addressSpan.getAttribute("data-type") === "address"
    );

    const masked = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("住所ON時のコピーはMASKする", masked.indexOf(" [MASK] ") !== -1);

    toggleHighlightTarget(addressSpan);
    const copied = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("住所OFF時のコピーは元文字列を含む", copied.indexOf("東京都渋谷区道玄坂1-2-3") !== -1);
    assertTrue("住所OFF時のコピーはMASKしない", copied.indexOf("[MASK]") === -1);
  }

  return results;
}
