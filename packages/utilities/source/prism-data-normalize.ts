/**
 * Canonical civic field cleanup. URL, email, and phone are local.
 * Address asks Google Address Validation (USPS CASS) when an API key is supplied.
 */

export type PrismDataNormalizeMode = "url" | "email" | "phone" | "address";

export type PrismDataNormalizeAddressOptions = {
  apiKey: string;
  fetchImpl?: typeof fetch;
};

const TRACKING_PARAMETER = /^(?:utm_.+|gclid|fbclid)$/;

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return trimmed;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return trimmed;
  }

  url.username = "";
  url.password = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  try {
    url.pathname = decodeURI(url.pathname).toLowerCase();
  } catch {
    url.pathname = url.pathname.toLowerCase();
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    const nextKey = key.toLowerCase();
    if (TRACKING_PARAMETER.test(nextKey)) continue;
    kept.append(nextKey, value.toLowerCase());
  }
  url.search = kept.toString() ? `?${kept.toString()}` : "";

  return url.toString();
}

function normalizeEmail(raw: string): string {
  let value = raw.trim().toLowerCase();
  if (!value) return "";
  value = value.replace(/^mailto:/, "");
  const angled = value.match(/<([^<>]+)>/);
  if (angled?.[1]) value = angled[1].trim();
  return value;
}

function normalizePhone(raw: string): string {
  const trimmed = collapseWhitespace(raw);
  if (!trimmed) return "";

  const extension = trimmed.match(/(?:ext\.?|x)\s*(\d+)\s*$/i);
  const body = extension ? trimmed.slice(0, extension.index).trim() : trimmed;
  let digits = body.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return trimmed;

  const formatted = `+1.${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return extension?.[1] ? `${formatted} x${extension[1]}` : formatted;
}

type UspsStandardizedAddress = {
  firstAddressLine?: string;
  secondAddressLine?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zipCodeExtension?: string;
};

function formatUspsAddress(address: UspsStandardizedAddress): string | null {
  const street = [address.firstAddressLine, address.secondAddressLine]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
  const zip = address.zipCode?.trim()
    ? address.zipCodeExtension?.trim()
      ? `${address.zipCode.trim()}-${address.zipCodeExtension.trim()}`
      : address.zipCode.trim()
    : "";
  const region = [address.state?.trim(), zip].filter(Boolean).join(" ");
  const locality = [address.city?.trim(), region].filter(Boolean).join(", ");
  const line = [street, locality].filter(Boolean).join(", ");
  return line || null;
}

async function normalizeAddress(
  raw: string,
  { apiKey, fetchImpl = fetch }: PrismDataNormalizeAddressOptions
): Promise<string> {
  const collapsed = collapseWhitespace(raw);
  if (!collapsed || !apiKey.trim()) return collapsed;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetchImpl(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            regionCode: "US",
            addressLines: [collapsed],
          },
          enableUspsCass: true,
        }),
      }
    );
    if (!response.ok) return collapsed;

    const payload = (await response.json()) as {
      result?: {
        address?: { formattedAddress?: string };
        uspsData?: { standardizedAddress?: UspsStandardizedAddress };
      };
    };
    const standardized = payload.result?.uspsData?.standardizedAddress;
    if (standardized) {
      const line = formatUspsAddress(standardized);
      if (line) return line;
    }
    const formatted = payload.result?.address?.formattedAddress?.trim();
    return formatted || collapsed;
  } catch {
    return collapsed;
  } finally {
    clearTimeout(timer);
  }
}

export const PrismDataNormalize = {
  url: normalizeUrl,
  email: normalizeEmail,
  phone: normalizePhone,
  address: normalizeAddress,
};
