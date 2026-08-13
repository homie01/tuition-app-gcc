import type { Standard, Subject } from "./types";

export const STANDARD_SUBJECT_MAPPING: Record<string, string[]> = {
  "5": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "6": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "7": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "8": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "9": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "10": ["English", "Hindi", "Gujarati", "Mathematics", "Science", "Social Science"],
  "11-Science": ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  "11-Commerce": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
  "12-Science": ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  "12-Commerce": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
};

/**
 * Extracts a standard number key e.g. "Standard 5" -> "5", "Standard 11" -> "11", 1 -> "5"
 */
export function getStandardKey(stdNameOrId: string | number | undefined, standards: Standard[] = []): string {
  if (!stdNameOrId) return "";
  let name = String(stdNameOrId);
  const found = standards.find((s) => String(s.id) === String(stdNameOrId) || s.name === stdNameOrId);
  if (found) {
    name = found.name;
  }
  const match = name.match(/\d+/);
  return match ? match[0] : name;
}

/**
 * Returns active subjects allocated for a specific standard & stream
 */
export function getSubjectsForStandard(
  standardIdOrName: string | number | undefined,
  stream: string | null | undefined,
  allSubjects: Subject[],
  allStandards: Standard[] = []
): Subject[] {
  const activeSubs = allSubjects.filter((s) => s.active);
  const stdKey = getStandardKey(standardIdOrName, allStandards);
  if (!stdKey) return activeSubs;

  let mapKey = stdKey;
  if (stdKey === "11" || stdKey === "12") {
    const st = stream === "Commerce" ? "Commerce" : "Science";
    mapKey = `${stdKey}-${st}`;
  }

  const expectedNames = STANDARD_SUBJECT_MAPPING[mapKey];
  if (!expectedNames) {
    return activeSubs;
  }

  // Filter active subjects that match the expected names
  const matched = activeSubs.filter((s) => expectedNames.includes(s.name));

  // Sort matched subjects according to the defined standard mapping order
  matched.sort((a, b) => {
    const idxA = expectedNames.indexOf(a.name);
    const idxB = expectedNames.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return matched;
}
