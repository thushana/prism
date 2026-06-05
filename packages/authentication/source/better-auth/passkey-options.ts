export interface PasskeyRelyingPartyOptions {
  baseURL: string;
  rpName: string;
  rpID?: string;
  origin?: string;
}

export interface PasskeyRelyingParty {
  rpID: string;
  rpName: string;
  origin: string;
}

/** Derive WebAuthn RP ID and origin from the Better Auth base URL. */
export function resolvePasskeyRelyingParty(
  options: PasskeyRelyingPartyOptions
): PasskeyRelyingParty {
  const url = new URL(options.baseURL);
  const origin = options.origin ?? `${url.protocol}//${url.host}`;
  const hostname = url.hostname;

  let rpID = options.rpID;
  if (!rpID) {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      rpID = "localhost";
    } else if (hostname.endsWith(".localhost")) {
      // e.g. porch-scope.localhost — not a subdomain of bare localhost
      rpID = hostname;
    } else if (hostname.startsWith("www.")) {
      rpID = hostname.slice(4);
    } else {
      rpID = hostname;
    }
  }

  return {
    rpID,
    rpName: options.rpName,
    origin,
  };
}
