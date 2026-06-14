import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encodedCredentials] = authHeader.split(" ");

    if (scheme === "Basic" && encodedCredentials) {
      const credentials = atob(encodedCredentials);
      const separatorIndex = credentials.indexOf(":");

      const providedUsername = credentials.slice(0, separatorIndex);
      const providedPassword = credentials.slice(separatorIndex + 1);

      if (providedUsername === username && providedPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="LVPs Quiniela"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};