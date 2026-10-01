/**
 * 個人名（姓名）検出のテスト。
 * ブラウザで tests/run.html を開いて実行する。
 */

function runPersonTests() {
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
    "山田太郎を検出する",
    detectPersonNames("山田太郎"),
    ["山田太郎"]
  );

  assertEqual(
    "佐藤花子を検出する",
    detectPersonNames("佐藤花子"),
    ["佐藤花子"]
  );

  assertEqual(
    "鈴木一郎を検出する",
    detectPersonNames("鈴木一郎"),
    ["鈴木一郎"]
  );

  assertEqual(
    "文章中の個人名を検出する",
    detectPersonNames("連絡先は山田太郎と test@example.com です"),
    ["山田太郎"]
  );

  assertEqual(
    "空文字は空配列を返す（個人名）",
    detectPersonNames(""),
    []
  );

  assertEqual(
    "地名は検出しない",
    detectPersonNames("東京"),
    []
  );

  assertEqual(
    "一般単語は検出しない（会社）",
    detectPersonNames("会社"),
    []
  );

  assertEqual(
    "一般単語は検出しない（サンプル）",
    detectPersonNames("サンプル"),
    []
  );

  assertEqual(
    "一般単語は検出しない（商事）",
    detectPersonNames("商事"),
    []
  );

  assertEqual(
    "法人格は検出しない",
    detectPersonNames("株式会社"),
    []
  );

  assertEqual(
    "名だけでは検出しない",
    detectPersonNames("太郎"),
    []
  );

  assertEqual(
    "姓だけでは検出しない",
    detectPersonNames("山田"),
    []
  );

  const tokens = tokenizeText("A 山田太郎 B");
  assertEqual("個人名のトークン件数", tokens.length, 3);
  assertEqual("個人名は person トークン", tokens[1], {
    type: "person",
    value: "山田太郎",
    disabled: false,
  });

  const mixedEmail = tokenizeText("連絡先は山田太郎と test@example.com です");
  const mixedEmailTargets = mixedEmail.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("個人名とメールが混在しても件数は2つの対象", mixedEmailTargets.length, 2);
  assertEqual("混在時も個人名トークンを残す", mixedEmailTargets[0], {
    type: "person",
    value: "山田太郎",
    disabled: false,
  });
  assertEqual("混在時もメールトークンを残す", mixedEmailTargets[1], {
    type: "email",
    value: "test@example.com",
    disabled: false,
  });

  const mixedCompany = tokenizeText("担当者：佐藤花子（株式会社サンプル）");
  const mixedCompanyTargets = mixedCompany.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("個人名と企業名が混在しても件数は2つの対象", mixedCompanyTargets.length, 2);
  assertEqual("混在時も個人名を残す（企業名つき）", mixedCompanyTargets[0], {
    type: "person",
    value: "佐藤花子",
    disabled: false,
  });
  assertEqual("混在時も企業名トークンを残す", mixedCompanyTargets[1], {
    type: "company",
    value: "株式会社サンプル",
    disabled: false,
  });

  const mixedPhone = tokenizeText("山田太郎 と 03-1234-5678");
  const mixedPhoneTargets = mixedPhone.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("個人名と電話が混在しても件数は2つの対象", mixedPhoneTargets.length, 2);
  assertEqual("混在時も電話番号トークンを残す", mixedPhoneTargets[1], {
    type: "phone",
    value: "03-1234-5678",
    disabled: false,
  });

  const mixedAddress = tokenizeText("山田太郎 東京都渋谷区道玄坂1-2-3");
  const mixedAddressTargets = mixedAddress.filter(function (token) {
    return token.type !== "text";
  });
  assertEqual("個人名と住所が混在しても件数は2つの対象", mixedAddressTargets.length, 2);
  assertEqual("混在時も住所トークンを残す", mixedAddressTargets[1], {
    type: "address",
    value: "東京都渋谷区道玄坂1-2-3",
    disabled: false,
  });

  assertEqual(
    "個人名ONは [氏名] に置換する",
    buildMaskedText([
      { type: "text", value: "担当:" },
      { type: "person", value: "山田太郎", disabled: false },
    ]),
    "担当: [氏名] "
  );

  assertEqual(
    "個人名OFFは元のまま残す",
    buildMaskedText([
      { type: "text", value: "担当:" },
      { type: "person", value: "山田太郎", disabled: true },
    ]),
    "担当:山田太郎"
  );

  if (typeof document !== "undefined") {
    const mount = document.createElement("div");
    renderHighlighted("山田太郎", mount);
    const personSpan = mount.querySelector(".highlight");
    assertTrue("個人名はハイライトされる", personSpan !== null);
    assertTrue(
      "個人名の表示値",
      personSpan !== null && personSpan.textContent === "山田太郎"
    );
    assertTrue(
      "個人名の data-type",
      personSpan !== null && personSpan.getAttribute("data-type") === "person"
    );

    const masked = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("個人名ON時のコピーはMASKする", masked.indexOf(" [氏名] ") !== -1);

    toggleHighlightTarget(personSpan);
    const copied = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("個人名OFF時のコピーは元文字列を含む", copied.indexOf("山田太郎") !== -1);
    assertTrue("個人名OFF時のコピーはMASKしない", copied.indexOf("[氏名]") === -1);
  }

  const mixedAll = tokenizeText(
    "山田太郎と test@example.com と 03-1234-5678 と 東京都渋谷区道玄坂1-2-3 と 株式会社サンプル商事"
  );
  assertEqual(
    "混在文のコピーは種別ラベルになる",
    buildMaskedText(mixedAll),
    " [氏名] と  [メール]  と  [電話番号]  と  [住所]  と  [企業名] "
  );

  return results;
}
