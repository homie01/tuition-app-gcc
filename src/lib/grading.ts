export type GradeBand = { grade: string; min: number; label: string };

export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { grade: "A+", min: 90, label: "Outstanding" },
  { grade: "A", min: 80, label: "Excellent" },
  { grade: "B+", min: 70, label: "Very Good" },
  { grade: "B", min: 60, label: "Good" },
  { grade: "C", min: 50, label: "Average" },
  { grade: "D", min: 35, label: "Needs Improvement" },
  { grade: "F", min: 0, label: "Fail" },
];

export function gradeFor(percentage: number, bands: GradeBand[] = DEFAULT_GRADE_BANDS) {
  const sorted = [...(bands.length ? bands : DEFAULT_GRADE_BANDS)].sort((a, b) => b.min - a.min);
  return sorted.find((b) => percentage >= b.min) ?? sorted[sorted.length - 1];
}

export const DEFAULT_ABSENCE_TEMPLATE = `Dear {{guardian_name}},

This is to inform you that {{student_name}} (Father: {{father_name}}, ID: {{student_id}}) was absent from the {{standard}}-{{division}} {{shift}} tuition class on {{date}}.

Please contact us if there is any issue.

Thank you,
{{class_name}}`;

export const DEFAULT_RESULT_TEMPLATE = `Dear {{guardian_name}},

The result of {{student_name}} for {{exam_name}} is ready.

Total: {{total}}
Percentage: {{percentage}}%
Grade: {{grade}}

Regards,
{{class_name}}`;

export const TEMPLATE_VARIABLES = [
  "{{student_name}}",
  "{{father_name}}",
  "{{student_id}}",
  "{{guardian_name}}",
  "{{date}}",
  "{{standard}}",
  "{{division}}",
  "{{shift}}",
  "{{class_name}}",
  "{{exam_name}}",
  "{{total}}",
  "{{percentage}}",
  "{{grade}}",
];

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const v = vars[key.toLowerCase()];
    return v === undefined ? match : v;
  });
}
