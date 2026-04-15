# Multi-Language Email Support

This project now supports multiple language variations of email templates.

## Directory Structure

```
communications/
├── en/
│   └── Communications.md       # English emails
├── es/
│   └── Communications.md       # Spanish emails (Español)
└── fr/
    └── Communications.md       # French emails (Français)
```

Each language directory contains its own `Communications.md` file with localized content.

## Configuration

Edit `languages.json` to add/remove supported languages:

```json
{
  "languages": [
    { "code": "en", "locale": "en_US", "name": "English" },
    { "code": "es", "locale": "es_ES", "name": "Spanish" },
    { "code": "fr", "locale": "fr_FR", "name": "French" }
  ]
}
```

Fields:
- **code**: Language code (2 letters, used as directory name)
- **locale**: Iterable locale code (used in API calls for template variants)
- **name**: Display name for logs

## Workflow

### 1. Add a new language

1. Create a new directory in `communications/` with the language code
2. Create `Communications.md` in that directory
3. Add the language to `languages.json`

Example:
```bash
mkdir communications/de
# Copy and translate communications/en/Communications.md to communications/de/Communications.md
```

Then update `languages.json`:
```json
{ "code": "de", "locale": "de_DE", "name": "German" }
```

### 2. Generate emails

```bash
node email-generator.js
```

This will:
- Process each language directory
- Generate HTML files for each language
- Create `generated-emails/en/`, `generated-emails/es/`, `generated-emails/fr/`, etc.
- Save `emails-data.json` in each language folder with metadata

### 3. Push to Iterable

```bash
node push-to-iterable.js
```

This will:
- Upload templates for all languages
- Include the `locale` parameter in API calls for proper Iterable language handling
- Track templateIds per language in `iterable-manifest.json`

Example manifest structure:
```json
{
  "templates": {
    "Verify Your Email": {
      "en": { "templateId": "123", "locale": "en_US", ... },
      "es": { "templateId": "456", "locale": "es_ES", ... }
    }
  }
}
```

### 4. Update existing templates

After generating new versions:

```bash
node push-to-iterable.js
```

The script will:
- Check the manifest for existing templateIds
- Skip templates already uploaded (unless using `--update-all`)
- Use stored templateIds to update Iterable templates

To force re-upload all templates:
```bash
node push-to-iterable.js --update-all
```

## Current Setup

- **English (en)** — Communications file copied from original
- **Spanish (es)** — Directory created, awaiting translations
- **French (fr)** — Directory created, awaiting translations

## Next Steps

1. Translate `Communications.md` content for Spanish and French
2. Adjust template images if needed (e.g., language-specific logos)
3. Update metadata (contact info, portal links) per language if needed
4. Run generation and push to Iterable
