// Maps F1 nationality strings (from Ergast) to ISO country codes + flag emojis.
// Ergast returns nationalities like "British", "Dutch" — not country names.

const NATIONALITY_TO_CODE: Record<string, string> = {
  British: "GB",
  English: "GB",
  Scottish: "GB",
  Welsh: "GB",
  Dutch: "NL",
  German: "DE",
  Spanish: "ES",
  Monégasque: "MC",
  Monegasque: "MC",
  French: "FR",
  Italian: "IT",
  Mexican: "MX",
  Australian: "AU",
  Finnish: "FI",
  Danish: "DK",
  Canadian: "CA",
  Japanese: "JP",
  Thai: "TH",
  American: "US",
  Brazilian: "BR",
  Argentine: "AR",
  Argentinian: "AR",
  Belgian: "BE",
  Polish: "PL",
  Russian: "RU",
  Swedish: "SE",
  Austrian: "AT",
  Swiss: "CH",
  Portuguese: "PT",
  "New Zealander": "NZ",
  Irish: "IE",
  Hungarian: "HU",
  Czech: "CZ",
  Chinese: "CN",
  Indonesian: "ID",
  Indian: "IN",
  Venezuelan: "VE",
  Colombian: "CO",
  "South African": "ZA",
  Malaysian: "MY",
};

export function nationalityToFlag(nationality: string): string {
  const code = NATIONALITY_TO_CODE[nationality];
  if (!code) return "🏳️";

  // Convert ISO-2 country code to flag emoji via regional indicator symbols
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}