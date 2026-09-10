import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
} from "@anlat-hoca/config";

export function createPrivacyPolicyHtml(): string {
  const sections = PRIVACY_POLICY_SECTIONS.map(
    (section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        ${section.paragraphs
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join("\n")}
      </section>`,
  ).join("\n");

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Anlat Hoca Gizlilik Politikası</title>
    <style>
      :root { color: #111827; background: #f6f7fb; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; }
      main { box-sizing: border-box; width: min(100%, 760px); margin: 0 auto; padding: 32px 20px 64px; }
      h1 { margin: 0 0 8px; font-size: clamp(2rem, 7vw, 3rem); line-height: 1.1; }
      .updated { margin: 0 0 24px; color: #5b6475; }
      section { margin-top: 28px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }
      h2 { margin: 0 0 12px; color: #3730a3; font-size: 1.2rem; }
      p { margin: 10px 0 0; line-height: 1.65; }
    </style>
  </head>
  <body>
    <main>
      <h1>Anlat Hoca Gizlilik Politikası</h1>
      <p class="updated">Son güncelleme: ${escapeHtml(PRIVACY_POLICY_LAST_UPDATED)}</p>
      <p>${escapeHtml(PRIVACY_POLICY_INTRO)}</p>
      ${sections}
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}
