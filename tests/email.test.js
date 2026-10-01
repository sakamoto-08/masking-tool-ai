/**
 * メールアドレス検出のテスト。
 * ブラウザで tests/run.html を開いて実行する。
 */

function runEmailTests() {
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
    "一般的なメールアドレスを検出する",
    detectEmailAddresses("連絡先は test@example.com です"),
    ["test@example.com"]
  );

  assertEqual(
    "+タグ付きメールを検出する",
    detectEmailAddresses("user.name+tag@example.co.jp"),
    ["user.name+tag@example.co.jp"]
  );

  assertEqual(
    "複数のメールを検出する",
    detectEmailAddresses("a@example.com と b@example.co.jp"),
    ["a@example.com", "b@example.co.jp"]
  );

  assertEqual(
    "空文字は空配列を返す（メール）",
    detectEmailAddresses(""),
    []
  );

  assertEqual(
    "@がない文字列は検出しない",
    detectEmailAddresses("test.example.com"),
    []
  );

  assertEqual(
    "localが欠けたメールは検出しない",
    detectEmailAddresses("@example.com"),
    []
  );

  assertEqual(
    "domainが欠けたメールは検出しない",
    detectEmailAddresses("test@"),
    []
  );

  assertEqual(
    "TLDがないメールは検出しない",
    detectEmailAddresses("test@example"),
    []
  );

  assertEqual(
    "連続ドットのメールは検出しない",
    detectEmailAddresses("test..name@example.com"),
    []
  );

  const tokens = tokenizeText("A test@example.com B");
  assertEqual("メールのトークン件数", tokens.length, 3);
  assertEqual("メールは email トークン", tokens[1], {
    type: "email",
    value: "test@example.com",
    disabled: false,
  });

  const mixed = tokenizeText("03-1234-5678 と test@example.com");
  assertEqual("電話とメールが混在しても件数は2つの対象", mixed.filter(function (token) {
    return token.type !== "text";
  }).length, 2);
  assertEqual("混在時も電話番号トークンを残す", mixed[0], {
    type: "phone",
    value: "03-1234-5678",
    disabled: false,
  });
  assertEqual("混在時もメールトークンを残す", mixed[2], {
    type: "email",
    value: "test@example.com",
    disabled: false,
  });

  assertEqual(
    "メールONは [メール] に置換する",
    buildMaskedText([
      { type: "text", value: "連絡先:" },
      { type: "email", value: "test@example.com", disabled: false },
    ]),
    "連絡先: [メール] "
  );

  assertEqual(
    "メールOFFは元のまま残す",
    buildMaskedText([
      { type: "text", value: "連絡先:" },
      { type: "email", value: "test@example.com", disabled: true },
    ]),
    "連絡先:test@example.com"
  );

  if (typeof document !== "undefined") {
    const mount = document.createElement("div");
    renderHighlighted("連絡先は test@example.com です", mount);
    const emailSpan = mount.querySelector(".highlight");
    assertTrue("メールはハイライトされる", emailSpan !== null);
    assertTrue(
      "メールの表示値",
      emailSpan !== null && emailSpan.textContent === "test@example.com"
    );
    assertTrue(
      "メールの data-type",
      emailSpan !== null && emailSpan.getAttribute("data-type") === "email"
    );

    const masked = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("メールON時のコピーはMASKする", masked.indexOf(" [メール] ") !== -1);

    toggleHighlightTarget(emailSpan);
    const copied = buildMaskedText(tokensFromOutputElement(mount));
    assertTrue("メールOFF時のコピーは元文字列を含む", copied.indexOf("test@example.com") !== -1);
    assertTrue("メールOFF時のコピーはMASKしない", copied.indexOf("[メール]") === -1);
  }

  return results;
}
