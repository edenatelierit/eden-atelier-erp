import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { auth } from "@/auth";
import { canAccessPath } from "@/lib/rbac";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  locales,
  pathnameLocale,
  stripLocale,
  withLocale,
  type Locale,
} from "@/i18n/config";

function preferredLocale(request: { headers: Headers; cookies: { get(name: string): { value: string } | undefined } }): Locale {
  const cookie = request.cookies.get(localeCookieName)?.value;
  if (cookie && isLocale(cookie)) {
    return cookie;
  }

  const languages = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") ?? defaultLocale,
    },
  }).languages();

  try {
    const matched = match(languages, [...locales], defaultLocale);
    return isLocale(matched) ? matched : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const locale = pathnameLocale(pathname);
  if (!locale) {
    const nextLocale = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = withLocale(nextLocale, pathname);
    return NextResponse.redirect(url);
  }

  const path = stripLocale(pathname);
  const isLoggedIn = Boolean(request.auth?.user);
  const isLogin = path === "/login" || path.startsWith("/login/");
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);

  if (isLogin) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(withLocale(locale, "/"), request.url));
    }
    return NextResponse.next({ request: { headers } });
  }

  if (!isLoggedIn) {
    const login = new URL(withLocale(locale, "/login"), request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = request.auth?.user?.role;
  if (role && !canAccessPath(role, path)) {
    return NextResponse.redirect(new URL(withLocale(locale, "/"), request.url));
  }

  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
