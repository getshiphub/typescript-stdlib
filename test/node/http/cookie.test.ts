// This code has been ported almost directly from Go's src/net/http/cookie_test.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

import { bytes, http, log } from "../../../src";

describe("http/cookie.ts", () => {
  afterEach(() => {
    log.std.out = process.stderr;
  });

  test.each([
    [new http.Cookie("cookie-1", "v$1"), "cookie-1=v$1", false],
    [new http.Cookie("cookie-2", "two", { maxAge: 3600 }), "cookie-2=two; Max-Age=3600", false],
    [
      new http.Cookie("cookie-3", "three", { domain: ".example.com" }),
      "cookie-3=three; Domain=example.com",
      false,
    ],
    [
      new http.Cookie("cookie-4", "four", { path: "/restricted/" }),
      "cookie-4=four; Path=/restricted/",
      false,
    ],
    [new http.Cookie("cookie-5", "five", { domain: "wrong;bad.abc" }), "cookie-5=five", true],
    [new http.Cookie("cookie-6", "six", { domain: "bad-.abc" }), "cookie-6=six", true],
    [
      new http.Cookie("cookie-7", "seven", { domain: "127.0.0.1" }),
      "cookie-7=seven; Domain=127.0.0.1",
      false,
    ],
    [new http.Cookie("cookie-8", "eight", { domain: "::1" }), "cookie-8=eight", true],
    [
      new http.Cookie("cookie-9", "expiring", { expires: new Date(1257894000 * 1000) }),
      "cookie-9=expiring; Expires=Tue, 10 Nov 2009 23:00:00 GMT",
      false,
    ],
    // According to IETF 6265 Section 5.1.1.5, the year cannot be less than 1601
    [
      new http.Cookie("cookie-10", "expiring-1601", {
        expires: new Date(Date.UTC(1601, 0, 1, 1, 1, 1, 1)),
      }),
      "cookie-10=expiring-1601; Expires=Mon, 01 Jan 1601 01:01:01 GMT",
      false,
    ],
    [
      new http.Cookie("cookie-11", "invalid-expiry", {
        expires: new Date(Date.UTC(1600, 1, 1, 1, 1, 1, 1)),
      }),
      "cookie-11=invalid-expiry",
      false,
    ],
    [
      new http.Cookie("cookie-12", "samesite-default", { sameSite: http.SameSite.default }),
      "cookie-12=samesite-default; SameSite",
      false,
    ],
    [
      new http.Cookie("cookie-13", "samesite-lax", { sameSite: http.SameSite.lax }),
      "cookie-13=samesite-lax; SameSite=Lax",
      false,
    ],
    [
      new http.Cookie("cookie-14", "samesite-strict", { sameSite: http.SameSite.strict }),
      "cookie-14=samesite-strict; SameSite=Strict",
      false,
    ],
    [
      new http.Cookie("cookie-15", "samesite-none", { sameSite: http.SameSite.none }),
      "cookie-15=samesite-none; SameSite=None",
      false,
    ],
    [
      new http.Cookie("cookie-16", "httponly", { httpOnly: true }),
      "cookie-16=httponly; HttpOnly",
      false,
    ],
    [new http.Cookie("cookie-17", "secure", { secure: true }), "cookie-17=secure; Secure", false],
    [
      new http.Cookie("cookie-18", "max-age-0", { maxAge: -10 }),
      "cookie-18=max-age-0; Max-Age=0",
      false,
    ],
    // The "special" cookies have values containing commas or spaces which
    // are disallowed by RFC 6265 but are common in the wild.
    [new http.Cookie("special-1", "a z"), `special-1="a z"`, false],
    [new http.Cookie("special-2", " z"), `special-2=" z"`, false],
    [new http.Cookie("special-3", "a "), `special-3="a "`, false],
    [new http.Cookie("special-4", " "), `special-4=" "`, false],
    [new http.Cookie("special-5", "a,z"), `special-5="a,z"`, false],
    [new http.Cookie("special-6", ",z"), `special-6=",z"`, false],
    [new http.Cookie("special-7", "a,"), `special-7="a,"`, false],
    [new http.Cookie("special-8", ","), `special-8=","`, false],
    [new http.Cookie("empty-value", ""), `empty-value=`, false],
    [new http.Cookie("", ""), "", false],
    [new http.Cookie("\t", ""), "", false],
    [new http.Cookie("\r", ""), "", false],
    [new http.Cookie("a\nb", "v"), "", false],
    [new http.Cookie("a\rb", "v"), "", false],
  ])("http.Cookie.toString: %#", (cookie, expected, hasLog) => {
    const logbuf = new bytes.DynamicBuffer();
    log.std.out = logbuf;

    expect(cookie.toString()).toBe(expected);

    if (hasLog) {
      expect(logbuf.toString()).toContain("dropping domain attribute");
    } else {
      expect(logbuf.toString()).toBe("");
    }
  });

  test.each([
    ["foo", "foo", false],
    ["foo;bar", "foobar", true],
    ["foo\\bar", "foobar", true],
    ['foo"bar', "foobar", true],
    ["\x00\x7e\x7f\x80", "\x7e", true],
    [`"withquotes"`, "withquotes", true],
    ["a z", `"a z"`, false],
    [" z", `" z"`, false],
    ["a ", `"a "`, false],
    ["a,z", `"a,z"`, false],
    [",z", `",z"`, false],
    ["a,", `"a,"`, false],
  ])(`http.Cookie.toString: sanitize value "%s"`, (v, expected, hasLog) => {
    const logbuf = new bytes.DynamicBuffer();
    log.std.out = logbuf;

    const c = new http.Cookie("test", v);
    expect(c.toString()).toBe(`test=${expected}`);

    if (hasLog) {
      expect(logbuf.toString()).toContain("dropping invalid characters");
    } else {
      expect(logbuf.toString()).toBe("");
    }
  });

  test.each([
    ["/path", "/path", false],
    ["/path with space/", "/path with space/", false],
    ["/just;no;semicolon\x00orstuff/", "/justnosemicolonorstuff/", true],
  ])(`http.Cookie.toString: sanitize path "%s"`, (path, expected, hasLog) => {
    const logbuf = new bytes.DynamicBuffer();
    log.std.out = logbuf;

    const c = new http.Cookie("foo", "bar", { path });
    expect(c.toString()).toBe(`foo=bar; Path=${expected}`);

    if (hasLog) {
      expect(logbuf.toString()).toContain("dropping invalid characters");
    } else {
      expect(logbuf.toString()).toBe("");
    }
  });

  test.each([
    [["Cookie-1=v$1"], [new http.Cookie("Cookie-1", "v$1", { raw: "Cookie-1=v$1" })]],
    [
      [
        "NID=99=YsDT5i3E-CXax-; expires=Wed, 23-Nov-2011 01:05:03 GMT; path=/; domain=.google.ch; HttpOnly",
      ],
      [
        new http.Cookie("NID", "99=YsDT5i3E-CXax-", {
          path: "/",
          domain: ".google.ch",
          httpOnly: true,
          expires: new Date(Date.UTC(2011, 10, 23, 1, 5, 3, 0)),
          rawExpires: "Wed, 23-Nov-2011 01:05:03 GMT",
          raw:
            "NID=99=YsDT5i3E-CXax-; expires=Wed, 23-Nov-2011 01:05:03 GMT; path=/; domain=.google.ch; HttpOnly",
        }),
      ],
    ],
    [
      [".ASPXAUTH=7E3AA; expires=Wed, 07-Mar-2012 14:25:06 GMT; path=/; HttpOnly"],
      [
        new http.Cookie(".ASPXAUTH", "7E3AA", {
          path: "/",
          httpOnly: true,
          expires: new Date(Date.UTC(2012, 2, 7, 14, 25, 6, 0)),
          rawExpires: "Wed, 07-Mar-2012 14:25:06 GMT",
          raw: ".ASPXAUTH=7E3AA; expires=Wed, 07-Mar-2012 14:25:06 GMT; path=/; HttpOnly",
        }),
      ],
    ],
    [
      ["ASP.NET_SessionId=foo; path=/; HttpOnly"],
      [
        new http.Cookie("ASP.NET_SessionId", "foo", {
          path: "/",
          httpOnly: true,
          raw: "ASP.NET_SessionId=foo; path=/; HttpOnly",
        }),
      ],
    ],
    [
      ["samesitedefault=foo; SameSite"],
      [
        new http.Cookie("samesitedefault", "foo", {
          sameSite: http.SameSite.default,
          raw: "samesitedefault=foo; SameSite",
        }),
      ],
    ],
    [
      ["ASP.NET_SessionId=foo; path=/; HttpOnly"],
      [
        new http.Cookie("ASP.NET_SessionId", "foo", {
          path: "/",
          httpOnly: true,
          raw: "ASP.NET_SessionId=foo; path=/; HttpOnly",
        }),
      ],
    ],
    [
      ["samesitelax=foo; SameSite=Lax"],
      [
        new http.Cookie("samesitelax", "foo", {
          sameSite: http.SameSite.lax,
          raw: "samesitelax=foo; SameSite=Lax",
        }),
      ],
    ],
    [
      ["samesitestrict=foo; SameSite=Strict"],
      [
        new http.Cookie("samesitestrict", "foo", {
          sameSite: http.SameSite.strict,
          raw: "samesitestrict=foo; SameSite=Strict",
        }),
      ],
    ],
    [
      ["samesitenone=foo; SameSite=None"],
      [
        new http.Cookie("samesitenone", "foo", {
          sameSite: http.SameSite.none,
          raw: "samesitenone=foo; SameSite=None",
        }),
      ],
    ],
    [
      ["foo=bar; Secure"],
      [new http.Cookie("foo", "bar", { secure: true, raw: "foo=bar; Secure" })],
    ],
    [
      ["foo=bar; Max-Age=3600"],
      [new http.Cookie("foo", "bar", { maxAge: 3600, raw: "foo=bar; Max-Age=3600" })],
    ],
    [
      ["foo=bar; Max-Age=-10"],
      [new http.Cookie("foo", "bar", { maxAge: -1, raw: "foo=bar; Max-Age=-10" })],
    ],
    [[], []],
    // Make sure we can properly read back the Set-Cookie headers we create
    // for values containing spaces or commas:
    [
      [`special-1=a z`],
      [
        new http.Cookie("special-1", "a z", {
          raw: `special-1=a z`,
        }),
      ],
    ],
    [
      [`special-2=" z"`],
      [
        new http.Cookie("special-2", " z", {
          raw: `special-2=" z"`,
        }),
      ],
    ],
    [
      [`special-3="a "`],
      [
        new http.Cookie("special-3", "a ", {
          raw: `special-3="a "`,
        }),
      ],
    ],
    [
      [`special-4=" "`],
      [
        new http.Cookie("special-4", " ", {
          raw: `special-4=" "`,
        }),
      ],
    ],
    [
      [`special-5="a,z"`],
      [
        new http.Cookie("special-5", "a,z", {
          raw: `special-5="a,z"`,
        }),
      ],
    ],
    [
      [`special-6=",z"`],
      [
        new http.Cookie("special-6", ",z", {
          raw: `special-6=",z"`,
        }),
      ],
    ],
    [
      [`special-7=a,`],
      [
        new http.Cookie("special-7", "a,", {
          raw: `special-7=a,`,
        }),
      ],
    ],
    [
      [`special-8=","`],
      [
        new http.Cookie("special-8", ",", {
          raw: `special-8=","`,
        }),
      ],
    ],
  ])("http.readSetCookies: %#", (lines, cookies) => {
    expect(http.readSetCookies(lines)).toEqual(cookies);
  });

  test.each([
    [
      { cookie: "Cookie-1=v$1; c2=v2" },
      "",
      [new http.Cookie("Cookie-1", "v$1"), new http.Cookie("c2", "v2")],
    ],
    [{ cookie: "Cookie-1=v$1; c2=v2" }, "c2", [new http.Cookie("c2", "v2")]],
    [
      { cookie: `Cookie-1="v$1"; c2="v2"` },
      "",
      [new http.Cookie("Cookie-1", "v$1"), new http.Cookie("c2", "v2")],
    ],
    [
      { cookie: `Cookie-1="v$1"; c2=v2;` },
      "",
      [new http.Cookie("Cookie-1", "v$1"), new http.Cookie("c2", "v2")],
    ],
    [{ cookie: "" }, "", []],
    [{}, "", []],
    // Drop invalid cookies
    [{ cookie: `Cookie-1=v"$1; c2=v2` }, "", [new http.Cookie("c2", "v2")]],
    [{ cookie: `Co\\okie-1=v$1; c2=v2` }, "", [new http.Cookie("c2", "v2")]],
  ])("http.readCookies: %#", (h, filter, cookies) => {
    expect(http.readCookies(h, filter)).toEqual(cookies);
  });
});
