/**
 * 企業名・組織名検出のテスト。
 * ブラウザで tests/run.html を開いて実行する。
 */

function runCompanyTests() {
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
    "株式会社を検出する",
    detectCompanyNames("株式会社サンプル商事"),
    ["株式会社サンプル商事"]
  );

  assertEqual(
    "（株）の略称を検出する",
    detectCompanyNames("（株）テスト工業"),
    ["（株）テスト工業"]
  );

  assertEqual(
    "有限会社を検出する",
    detectCompanyNames("有限会社山田商店"),
    ["有限会社山田商店"]
  );

  assertEqual(
    "合同会社を検出する",
    detectCompanyNames("合同会社ABCデザイン"),
    ["合同会社ABCデザイン"]
  );

  assertEqual(
    "文章中の企業名を検出する",
    detectCompanyNames("連絡先は株式会社サンプルと test@example.com です"),
    ["株式会社サンプル"]
  );

  assertEqual(
    "空文字は空配列を返す（企業名）",
    detectCompanyNames(""),
    []
  );

  assertEqual(
    "法人格だけでは検出しない",
    detectCompanyNames("株式会社"),
    []
  );

  assertEqual(
    "一般的な単語だけでは検出しない（サンプル）",
    detectCompanyNames("サンプル"),
    []
  );

  assertEqual(
    "一般的な単語だけでは検出しない（商事）",
    detectCompanyNames("商事"),
    []
  );

  const tokens = tokenizeText("A 株式会社サンプル商事 B");
  assertEqual("企業名のトークン件数", tokens.length, 3);
  assertEqual("企業名は company トークン", tokens[1], {
    type: "company",
    value: "株式会社サンプル商事",
    disabled: false,
  });

  const mixed = tokenizeText(
    "連絡先は株式会社サンプルと test@example.com です"
  );
  const mixedTargets = mixed.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("企業名とメールが混在しても件数は2つの対象", mixedTargets.length, 2);
  assertEqual("混在時も企業名トークンを残す", mixedTargets[0], {
    type: "company",
    value: "株式会社サンプル",
    disabled: false,
  });
  assertEqual("混在時もメールトークンを残す", mixedTargets[1], {
    type: "email",
    value: "test@example.com",
    disabled: false,
  });

  const withPhone = tokenizeText("株式会社サンプル商事 と 03-1234-5678");
  const withPhoneTargets = withPhone.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("企業名と電話が混在しても件数は2つの対象", withPhoneTargets.length, 2);
  assertEqual("混在時も電話番号トークンを残す", withPhoneTargets[1], {
    type: "phone",
    value: "03-1234-5678",
    disabled: false,
  });

  const withAddress = tokenizeText(
    "株式会社サンプル商事 東京都渋谷区道玄坂1-2-3"
  );
  const withAddressTargets = withAddress.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("企業名と住所が混在しても件数は2つの対象", withAddressTargets.length, 2);
  assertEqual("混在時も住所トークンを残す", withAddressTargets[1], {
    type: "address",
    value: "東京都渋谷区道玄坂1-2-3",
    disabled: false,
  });

  assertEqual(
    "企業名ONは [企業名] に置換する",
    buildMaskedText([
      { type: "text", value: "会社:" },
      { type: "company", value: "株式会社サンプル商事", disabled: false },
    ]),
    "会社: [企業名] "
  );

  assertEqual(
    "企業名OFFは元のまま残す",
    buildMaskedText([
      { type: "text", value: "会社:" },
      { type: "company", value: "株式会社サンプル商事", disabled: true },
    ]),
    "会社:株式会社サンプル商事"
  );

  if (typeof document !== "undefined") {
    const mount = document.createElement("div");
    renderHighlighted("株式会社サンプル商事", mount);
    const companySpan = mount.querySelector(".highlight");
    assertTrue("企業名はハイライトされる", companySpan !== null);
    assertTrue(
      "企業名の表示値",
      companySpan !== null && companySpan.textContent === "株式会社サンプル商事"
    );
    assertTrue(
      "企業名の data-type",
      companySpan !== null && companySpan.getAttribute("data-type") === "company"
    );

    const masked = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("企業名ON時のコピーはMASKする", masked.indexOf(" [企業名] ") !== -1);

    toggleHighlightTarget(companySpan);
    const copied = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue(
      "企業名OFF時のコピーは元文字列を含む",
      copied.indexOf("株式会社サンプル商事") !== -1
    );
    assertTrue("企業名OFF時のコピーはMASKしない", copied.indexOf("[企業名]") === -1);
  }

  return results;
}
