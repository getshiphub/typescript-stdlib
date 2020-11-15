// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported almost directly from Go's src/net/http/cookie.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

import { IncomingHttpHeaders } from "http";
import net from "net";
import * as log from "../log/mod";
import * as strconv from "../strconv/mod";
import * as strings from "../strings/mod";

/**
 * SameSite allows a server to define a cookie attribute making it impossible for
 * the browser to send this cookie along with cross-site requests. The main
 * goal is to mitigate the risk of cross-origin information leakage, and provide
 * some protection against cross-site request forgery attacks.
 *
 * See https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00 for details.
 */
export enum SameSite {
  default,
  lax,
  strict,
  none,
}

const tokenSet = new Set([
  "!",
  "#",
  "$",
  "%",
  "&",
  "'",
  "*",
  "+",
  "-",
  ".",
  "^",
  "_",
  "`",
  "|",
  "~",
]);

function isTokenChar(c: string): boolean {
  return (
    (c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || tokenSet.has(c)
  );
}

function isCookieNameValid(raw: string): boolean {
  if (raw === "") {
    return false;
  }

  // Make sure there are no invalid characters in the name
  // Based on the `token` production in RFC2616
  // See: https://tools.ietf.org/html/rfc2616#section-2.2
  return (
    strings.indexFunc(raw, (c: string): boolean => {
      return !isTokenChar(c);
    }) < 0
  );
}

function sanitizeOrWarn(fieldName: string, valid: (c: string) => boolean, v: string): string {
  let ok = true;
  for (let i = 0; i < v.length; i++) {
    if (valid(v[i])) {
      continue;
    }

    log.std.warn(`http: invalid character "${v[i]}" in ${fieldName}, dropping invalid characters`);
    ok = false;
    break;
  }

  if (ok) {
    return v;
  }

  const buf: string[] = [];
  for (let i = 0; i < v.length; i++) {
    const b = v[i];
    if (valid(b)) {
      buf.push(b);
    }
  }

  return buf.join("");
}

function validCookieValueChar(c: string): boolean {
  return c >= " " && c <= "~" && c !== `"` && c !== ";" && c !== "\\";
}

/**
 * sanitizeCookieValue produces a suitable cookie-value from v.
 * https://tools.ietf.org/html/rfc6265#section-4.1.1
 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
 *            ; US-ASCII characters excluding CTLs,
 *            ; whitespace DQUOTE, comma, semicolon,
 *            ; and backslash
 * We loosen this as spaces and commas are common in cookie values
 * but we produce a quoted cookie-value if and only if v contains
 * commas or spaces.
 */
function sanitizeCookieValue(v: string): string {
  const s = sanitizeOrWarn("Cookie.value", validCookieValueChar, v);
  if (s.length === 0) {
    return s;
  }

  if (s.indexOf(" ") >= 0 || s.indexOf(",") >= 0) {
    return `"${s}"`;
  }

  return s;
}

function validCookiePathChar(c: string): boolean {
  return c >= " " && c <= "~" && c !== ";";
}

/**
 * isCookieDomainName reports whether s is a valid domain name or a valid
 * domain name with a leading dot '.'.
 */
function isCookieDomainName(s: string): boolean {
  let n = s;
  if (n.length === 0) {
    return false;
  }

  if (n.length > 255) {
    return false;
  }

  if (n[0] === ".") {
    // domain may start with a leading dot
    n = n.slice(1);
  }

  let last = ".";
  // ok once we've seen a letter
  let ok = false;
  let partlen = 0;
  for (let i = 0; i < n.length; i++) {
    const c = n[i];
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
      ok = true;
      partlen++;
    } else if (c >= "0" && c <= "9") {
      partlen++;
    } else if (c === "-") {
      if (last === ".") {
        return false;
      }
      partlen++;
    } else if (c === ".") {
      if (last === "." || last === "-") {
        return false;
      }

      if (partlen > 63 || partlen === 0) {
        return false;
      }

      partlen = 0;
    } else {
      return false;
    }

    last = c;
  }

  if (last === "-" || partlen > 63) {
    return false;
  }

  return ok;
}

// validCookieDomain reports whether v is a valid cookie domain-value.
function validCookieDomain(v: string): boolean {
  if (isCookieDomainName(v)) {
    return true;
  }

  if (net.isIP(v) > 0 && !v.includes(":")) {
    return true;
  }

  return false;
}

function parseCookieValue(raw: string, allowDoubleQuote: boolean): [string, boolean] {
  // strip the quotes, if present
  let v = raw;
  if (allowDoubleQuote && v.length > 1 && v[0] === `"` && v[v.length - 1] === `"`) {
    v = v.slice(1, v.length - 1);
  }

  for (let i = 0; i < v.length; i++) {
    if (!validCookieValueChar(v[i])) {
      return ["", false];
    }
  }

  return [v, true];
}

/**
 * A Cookie represents an HTTP cookie that is present either in the
 * Set-Cookie header of an HTTP reponse or the Cookie header of an
 * HTTP request.
 *
 * See https://tools.ietf.org/html/rfc6265 for details.
 */
export class Cookie {
  name: string;
  value: string;
  path: string;
  domain: string;
  expires?: Date;
  rawExpires?: string; // for reading cookies only
  /**
   * maxAge = 0 means no 'Max-Age' attribute specified.
   * maxAge < 0 means delete cookie now, equivalently 'Max-Age: 0'
   * maxAge > 0 means Max-Age attribute present and given in seconds
   */
  maxAge: number;
  secure = false;
  httpOnly = false;
  sameSite?: SameSite;
  raw: string;
  unparsed: string[] = []; // Raw text of unparsed attribute-value pairs

  constructor(
    name: string,
    value: string,
    attributes?: {
      path?: string;
      domain?: string;
      expires?: Date;
      rawExpires?: string;
      maxAge?: number;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: SameSite;
      raw?: string;
    },
  ) {
    this.name = name;
    this.value = value;
    this.path = attributes?.path ?? "";
    this.domain = attributes?.domain ?? "";
    this.expires = attributes?.expires;
    this.rawExpires = attributes?.rawExpires;
    this.maxAge = attributes?.maxAge ?? 0;
    this.secure = attributes?.secure ?? false;
    this.httpOnly = attributes?.httpOnly ?? false;
    this.sameSite = attributes?.sameSite;
    this.raw = attributes?.raw ?? "";
  }

  /**
   * toString returns the serialization of the cookie for use in a
   * Cookie header (if only `name` and `value` are set) or a
   * Set-Cookie (if other properties are set) response header.
   * If `name` is invalid, an empty string will be returned.
   */
  toString(): string {
    if (!isCookieNameValid(this.name)) {
      return "";
    }

    const parts: string[] = [];
    parts.push(`${this.name}=${sanitizeCookieValue(this.value)}`);

    if (this.path.length > 0) {
      // path-av           = "Path=" path-value
      // path-value        = <any CHAR except CTLs or ";">
      const sanitizedPath = sanitizeOrWarn("Cookie.path", validCookiePathChar, this.path);
      parts.push(`Path=${sanitizedPath}`);
    }

    if (this.domain.length > 0) {
      if (validCookieDomain(this.domain)) {
        // A domain containing illegal characters is not
        // sanitized but simply dropped which turns the cookie
        // into a host-only cookie. A leading dot is okay
        // but won't be sent.
        let d = this.domain;
        if (d[0] === ".") {
          d = d.slice(1);
        }
        parts.push(`Domain=${d}`);
      } else {
        log.std.warn(`http: invalid Cookie.domain "${this.domain}", dropping domain attribute`);
      }
    }

    // IETF RFC 6265 Section 5.1.1.5, the year must not be less than 1601
    if (this.expires !== undefined && this.expires.getUTCFullYear() >= 1601) {
      parts.push(`Expires=${this.expires.toUTCString()}`);
    }

    if (this.maxAge > 0 && Number.isInteger(this.maxAge)) {
      parts.push(`Max-Age=${this.maxAge}`);
    } else if (this.maxAge < 0) {
      parts.push("Max-Age=0");
    }

    if (this.httpOnly) {
      parts.push("HttpOnly");
    }

    if (this.secure) {
      parts.push("Secure");
    }

    switch (this.sameSite) {
      case SameSite.default:
        parts.push("SameSite");
        break;
      case SameSite.none:
        parts.push("SameSite=None");
        break;
      case SameSite.lax:
        parts.push("SameSite=Lax");
        break;
      case SameSite.strict:
        parts.push("SameSite=Strict");
        break;
      default:
        break;
    }

    return parts.join("; ");
  }
}

/**
 * readSetCookies parses all "Set-Cookie" values from
 * the array and returns the successfully parsed Cookies.
 */
export function readSetCookies(lines: string[]): Cookie[] {
  if (lines.length === 0) {
    return [];
  }

  const cookies: Cookie[] = [];
  for (const line of lines) {
    const parts = line.trim().split(";");
    if (parts.length === 1 && parts[0] === "") {
      continue;
    }

    parts[0] = parts[0].trim();
    const j = parts[0].indexOf("=");
    if (j < 0) {
      continue;
    }

    const name = parts[0].slice(0, j);
    const value = parts[0].slice(j + 1);
    if (!isCookieNameValid(name)) {
      continue;
    }

    const [parsedValue, ok] = parseCookieValue(value, true);
    if (!ok) {
      continue;
    }

    const cookie = new Cookie(name, parsedValue, { raw: line });
    for (let i = 1; i < parts.length; i++) {
      parts[i] = parts[i].trim();
      if (parts[i].length === 0) {
        continue;
      }

      let attr = parts[i];
      let val = "";
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const j = attr.indexOf("=");
      if (j >= 0) {
        val = attr.slice(j + 1);
        attr = attr.slice(0, j);
      }

      const lowerAttr = attr.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const [parsedVal, ok] = parseCookieValue(val, false);
      if (!ok) {
        cookie.unparsed.push(parts[i]);
        continue;
      }

      switch (lowerAttr) {
        case "samesite": {
          const lowerVal = parsedVal.toLowerCase();
          switch (lowerVal) {
            case "lax":
              cookie.sameSite = SameSite.lax;
              break;
            case "strict":
              cookie.sameSite = SameSite.strict;
              break;
            case "none":
              cookie.sameSite = SameSite.none;
              break;
            default:
              cookie.sameSite = SameSite.default;
              break;
          }
          continue;
        }
        case "secure":
          cookie.secure = true;
          continue;
        case "httponly":
          cookie.httpOnly = true;
          continue;
        case "domain":
          cookie.domain = parsedVal;
          continue;
        case "max-age": {
          const r = strconv.parseInt(parsedVal, 10);
          if (r.isFailure()) {
            break;
          }

          let secs = r.success();
          if (secs !== 0 && parsedVal[0] === "0") {
            break;
          }
          if (secs <= 0) {
            secs = -1;
          }
          cookie.maxAge = secs;
          continue;
        }
        case "expires": {
          cookie.rawExpires = parsedVal;
          // TODO(@cszatmary): This is sketchy, should add a
          // date string parser to the std lib
          const d = new Date(parsedVal);
          if (Number.isNaN(d.getTime())) {
            break;
          }
          cookie.expires = d;
          continue;
        }
        case "path":
          cookie.path = parsedVal;
          continue;
        default:
          break;
      }

      cookie.unparsed.push(parts[i]);
    }

    cookies.push(cookie);
  }

  return cookies;
}

/**
 * readCookies parses all "Cookie" values from the header `h` and
 * returns the successfully parsed Cookies.
 * If filter isn't empty, only cookies of that name are returned.
 */
export function readCookies(h: IncomingHttpHeaders, filter = ""): Cookie[] {
  let line = h.cookie;
  if (line == null) {
    return [];
  }

  const cookies: Cookie[] = [];
  line = line.trim();
  let part = "";
  while (line.length > 0) {
    const splitIndex = line.indexOf(";");
    if (splitIndex > 0) {
      part = line.slice(0, splitIndex);
      line = line.slice(splitIndex + 1);
    } else {
      part = line;
      line = "";
    }

    part = part.trim();
    if (part.length === 0) {
      continue;
    }

    let name = part;
    let val = "";
    const j = part.indexOf("=");
    if (j >= 0) {
      val = name.slice(j + 1);
      name = name.slice(0, j);
    }

    if (!isCookieNameValid(name)) {
      continue;
    }

    if (filter !== "" && filter !== name) {
      continue;
    }

    const [parsedVal, ok] = parseCookieValue(val, true);
    if (!ok) {
      continue;
    }

    cookies.push(new Cookie(name, parsedVal));
  }

  return cookies;
}
