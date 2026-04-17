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

### Step 1: Set up your language folder

The system now organizes emails by language. For a study with English emails:

1. You'll write your email content in a file called `Communications.md`
2. This file lives inside `communications/en/` folder
3. Your folder structure should look like:
   ```
   communications/
   └── en/
       └── Communications.md
   ```

We've already created this folder for you! You just need to edit the `Communications.md` file inside.

### Step 2: Fill in the Metadata section

Open the file `communications/en/Communications.md` and update the five fields at the top under `## Metadata`:

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

After completing Steps 2–4, your folder should look like:

```
email-generator.js
template-basic.html
template-with-button.html
languages.json
communications/
└── en/
    └── Communications.md
```

The `generated-emails/` output directory will be created automatically when you run the script.

### Step 6 — Run the script

**Option A: If you're using Terminal / Command Line**

1. Open your terminal
2. Navigate to your project folder
3. Type this command and press Enter:
   ```bash
   node email-generator.js
   ```

**Option B: If you prefer a graphical approach**

You can also use VS Code's built-in terminal or another code editor.

**What to expect:**

The script will print a line for each file it generates:
```
Vibrent Email Generator

Loaded 1 language(s): en

==================================================
Processing: English (en)
==================================================

Reading: communications/en/Communications.md
...
✓ Generated: s1-welcome.html
✓ Generated: m1-reminder.html
...
```

When it finishes you'll see:
```
✅ All languages processed!
Check the generated-emails/ directory for language folders
```

### Step 7 — Review and upload

1. Open the `generated-emails/` folder
2. You'll see a folder for each language (e.g., `en/`)
3. Navigate into `en/` and open a few HTML files in your browser to spot-check them
4. Check that:
   - Your logo appears
   - Your brand colors are correct
   - Subject lines, email text, and buttons look right
5. The `emails-data.json` file in that folder is a structured summary of all emails — useful for QA review before uploading to Iterable

Once you're satisfied, you're ready to push these templates to Iterable (see "Uploading to Iterable" section below).

---

## Uploading to Iterable

Once your emails are generated and reviewed, you can push them directly to Iterable.

### Setup (One-time only)

1. **Get your API key:**
   - Log into your Iterable account
   - Go to Settings → API Keys
   - Copy your API key

2. **Create the `.env` file:**
   - In your project folder, look for the file `.env.example`
   - Make a copy of it and rename the copy to `.env` (this is a hidden file)
   - Open `.env` in a text editor
   - Replace `your_api_key_here` with your actual Iterable API key
   - Save and close the file

   **IMPORTANT:** Never commit this `.env` file to git — it contains your secret API key. The `.gitignore` file already prevents this.

### Uploading Templates

Once setup is complete, run:

```bash
node push-to-iterable.js
```

The script will:
- Read all your generated HTML files
- Create new templates in Iterable
- Track which templates have been uploaded in a file called `iterable-manifest.json`
- Print a success message

Example output:
```
Iterable Email Template Pusher

✓ Loaded API key from .env
✓ Loaded 1 language(s): en

Processing: English (en)
──────────────────────────────────────
📤 Uploading [en] "Verify Your Email"...
   ✓ templateId: 12345
📤 Uploading [en] "Welcome to the Study"...
   ✓ templateId: 12346

✅ Uploaded/Updated: 2 template(s)
📋 Manifest saved to: iterable-manifest.json
```

### Updating Existing Templates

If you modify your emails and regenerate them:

1. Run the generation script again:
   ```bash
   node email-generator.js
   ```

2. Then run the push script:
   ```bash
   node push-to-iterable.js
   ```

The script will automatically detect which templates already exist and update them (using the `iterable-manifest.json` file to remember which ones you've uploaded).

---

## Multi-Language Support

The system supports emails in multiple languages. Currently set up for: **English (en)**, Spanish (es), French (fr).

### Adding Content for Another Language

Let's say you want to create Spanish versions of your emails:

1. **Copy the English file:**
   - Navigate to `communications/es/` folder
   - If `Communications.md` doesn't exist, copy it from `communications/en/Communications.md`

2. **Translate the content:**
   - Open `communications/es/Communications.md`
   - Translate the email content (keep the `## Metadata` section in English for now — study details are usually the same)
   - Save the file

3. **Generate emails for all languages:**
   ```bash
   node email-generator.js
   ```
   
   The script will now create:
   - `generated-emails/en/` — English versions
   - `generated-emails/es/` — Spanish versions

4. **Upload all languages to Iterable:**
   ```bash
   node push-to-iterable.js
   ```

   Iterable will recognize these as locale variants of the same templates and organize them accordingly.

### Adding a New Language (Not in the Default List)

1. **Add it to `languages.json`:**
   
   Open `languages.json` and add a new language. For example, to add German:
   ```json
   { "code": "de", "locale": "de_DE", "name": "German" }
   ```

2. **Create the folder and markdown file:**
   ```
   communications/
   └── de/
       └── Communications.md
   ```

3. **Copy and translate content:**
   - Copy `communications/en/Communications.md` to `communications/de/Communications.md`
   - Translate the email content

4. **Generate and upload:**
   ```bash
   node email-generator.js
   node push-to-iterable.js
   ```

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
- **Multiple languages**: The email-generator script automatically processes all languages in `communications/`. You only need to run it once per generation cycle.
- **API key safety**: The `.env` file contains your Iterable API key. Never share it, and never commit it to git. Use `.env.example` if you need to show someone the file structure.
