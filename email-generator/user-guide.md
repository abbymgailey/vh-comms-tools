# Vibrent Email Generator

This process takes content from a structured Markdown file and uses a Node.js script to convert the content into production-ready HTML email files. The overall process allows us to download a file from Google Docs, export two html templates from Iterable, run the script, and get upload-ready HTML files out.

---

## Prerequisites

- [Node.js](https://nodejs.org/) installed (v14+)
- The repo cloned locally

No npm install needed — the script uses only Node's built-in `fs` and `path` modules.

---

## New Study Walkthrough

Follow these steps each time you set up email generation for a new study.

### Step 1: Copy the Markdown template

Make a copy of `Communications Template.md` and rename it for your study (e.g. `communications template (MDA).md`). Keep the original untouched as our blank template for future studies.

### Step 2: Fill in the Metadata section

Open your new file and update the five fields at the top under `## Metadata`:

| Field | What to enter |
|---|---|
| `Study Name` | The study's display name exactly as it should appear in emails |
| `Study Team Email` | The reply-to / contact email for the study team |
| `Study Team Phone` | The study team's participant-facing phone number |
| `Portal Link` | The full URL to the study's Vibrent portal |
| `Postal Address` | The physical mailing address for CAN-SPAM compliance |

Leave the footer text and `{{variables}}` as-is — they reference the fields you just filled in and will resolve automatically.

### Step 3: Write your email content

Each `## ID: Title` section in the file is one email. The System Communications (S1–S6) are standard Vibrent-triggered emails. Review the body copy and adjust if needed, but they rarely require changes. The Custom Communications (M1 onward) are study-specific and will need your content.

For each custom email:
- Set `Trigger` and `Timing` to match what's been configured in Vibrent
- Write your `Subject` line
- Write `Email Content` — use `{{studyName}}`, `{{studyTeamEmail}}`, etc. where the study details should appear
- Add a `[ LOG IN ]` button marker on its own line if the email needs a CTA (and set `Template` to `template-with-button`)
- Write `SMS Content` if applicable

See [Email Section Fields](#email-section-fields) for the full field reference.

### Step 4: Build the HTML templates

The script needs two branded HTML email template files in the same folder as `email-generator.js`:

| File | Used for |
|---|---|
| `template-basic.html` | System/transactional emails — no CTA button |
| `template-with-button.html` | Marketing emails — includes header, button, and closing text blocks |

**Start from the existing templates in the repo** — they already have the correct slot structure. Swap in the client's branding: logo URL, brand colors, fonts. Do not rename or remove the `{{slot}}` placeholders — the script injects content into these at generation time.

Required slots per template:

`template-basic.html` must contain:
- `{{emailContent}}` — email body
- `{{footer}}` — footer text

`template-with-button.html` must contain:
- `{{emailHeader}}` — large header text above the body
- `{{emailContent}}` — body copy above the button
- `{{buttonText}}` — CTA button label
- `{{buttonUrl}}` — CTA button href
- `{{closingText}}` — body copy below the button
- `{{footer}}` — footer text

### Step 5 — Confirm your folder structure

Before running the script, your working folder should contain:

```
email-generator.js
template-basic.html
template-with-button.html
communications template (your study name).md
```

Everything must be in the same folder. The `generated-emails/` output directory will be created automatically.

### Step 6 — Run the script

Open a terminal, navigate to your folder, and run:

```bash
node email-generator.js "communications template (your study name).md"
```

If you named your file exactly `Communications Template.md` you can omit the filename:

```bash
node email-generator.js
```

The script will print a line for each file it generates. When it finishes you'll see:

```
✅ Complete! Check the generated-emails/ directory
```

### Step 7 — Review and upload

Open `generated-emails/` and spot-check a few HTML files in a browser before uploading to your ESP. The `emails-data.json` file in the same directory is a structured summary of all emails — subject lines, triggers, timing, and SMS content — useful for a QA review or handoff doc.

---

## Quick Reference

### Markdown File Structure

The file has two parts: a `## Metadata` section followed by one `## ID: Title` section per email.

IDs can be anything (`S1`, `M1`, `CP1`, etc.) and become part of the output filename.

```markdown
## M1: Consent Reminder

**Trigger**: Consent is made available (containerItem [XXX] unlocked/visible)
**Timing**: 5 days after consent is unlocked and not yet completed
**Subject**: Complete Your {{studyName}} Consent Form
**Template**: template-with-button
**Type**: Marketing

**Email Header: Reminder: Complete Your Consent to Participate in {{studyName}}**

**Email Content:**

Dear Participant,

This is a reminder to complete your consent to participate.

[ LOG IN ]

If you have questions, contact us at {{studyTeamEmail}}.

Thank you,
The {{studyName}} Team

**SMS Content:**
This is a reminder to complete your consent for {{studyName}}. Log in today: {{portalLink}}
```

### Email Section Fields

| Field | Required | Notes |
|---|---|---|
| `Trigger` | No | Documentation only — not rendered in output |
| `Timing` | No | Documentation only — not rendered in output |
| `Subject` | Yes | Not rendered in HTML — included in `emails-data.json` |
| `Template` | No | Template filename without `.html`. Defaults to `template-basic` |
| `Type` | Yes | `System` or `Marketing` — determines which footer is injected |
| `Email Header` | No | Large header text above body. Used only in `template-with-button` |
| `Email Content` | Yes | Email body. Supports `**bold**` and `[text](url)` Markdown |
| `SMS Content` | No | Documentation only — included in `emails-data.json` |

### CTA Buttons

Place one of the following markers on its own line inside `Email Content` to insert a button. Always pair with `Template: template-with-button`.

```
[ LOG IN ]
[ VERIFY EMAIL ]
[ RESET PASSWORD ]
```

Content above the marker → `{{emailContent}}`. Content below → `{{closingText}}`. Button URL always resolves to `{{portalLink}}` from Metadata.

### Variables

| Variable | Resolves from |
|---|---|
| `{{studyName}}` | Study Name in Metadata |
| `{{studyTeamEmail}}` | Study Team Email in Metadata |
| `{{studyTeamPhone}}` | Study Team Phone in Metadata |
| `{{portalLink}}` | Portal Link in Metadata |
| `{{postalAddress}}` | Postal Address in Metadata |

Variables like `{{hostedUnsubscribeUrl}}` are Vibrent platform variables — leave them as-is and they will be resolved by the ESP at send time.

---

## Adding a New Email

1. Add a new `## ID: Title` section to your Markdown file anywhere after the Metadata block.
2. Fill in `Subject`, `Type`, and `Email Content` at minimum.
3. Set `Template` to `template-with-button` if the email has a CTA button, otherwise `template-basic`.
4. Re-run the script. Only changed or new emails need to be re-uploaded to your ESP.

---

## Tips

- **Section separators** (`—`) between emails are optional but help readability.
- **Formatting**: `**bold**` renders as `<strong>`. Markdown links render as `<a>` tags styled for dark backgrounds — best used inside footer text.
- **Custom templates**: Add any `.html` file to the repo root and reference it by name (without `.html`) in the `Template` field. It must include the same `{{slot}}` placeholders.
