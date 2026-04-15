#!/usr/bin/env node

/**
 * Vibrent Email Generator
 *
 * This script parses the markdown communications file and generates
 * HTML email files using the template.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load languages configuration
function loadLanguages() {
  const languagesPath = path.join(__dirname, 'languages.json');
  if (!fs.existsSync(languagesPath)) {
    console.error('❌ Error: languages.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(languagesPath, 'utf8')).languages;
}

// Configuration
const CONFIG = {
  communicationsDir: 'communications',
  markdownFileTemplate: 'Communications.md', // Communications.md in each language dir
  templateDir: './',
  defaultTemplate: 'template-basic.html',
  outputDir: 'generated-emails',
  reportFile: 'generation-report.txt'
};

// Variable keys the script resolves from Metadata
const METADATA_KEYS = ['studyName', 'studyTeamEmail', 'studyTeamPhone', 'portalLink', 'postalAddress'];

// ─── Warning system ───────────────────────────────────────────────────────────

const warnings = [];

function addWarning(emailId, message) {
  warnings.push({ emailId: emailId || null, message });
}

function printWarnings() {
  console.log(`\n⚠️  ${warnings.length} warning(s) found:\n`);
  for (const w of warnings) {
    const prefix = w.emailId ? `[${w.emailId}]` : '[General]';
    console.log(`  ${prefix} ${w.message}`);
  }
}

async function promptContinue() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('\nContinue anyway? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function saveReport(outputDir) {
  const lines = [
    'Vibrent Email Generator — Generation Report',
    `Generated: ${new Date().toISOString()}`,
    '',
  ];

  if (warnings.length === 0) {
    lines.push('No warnings. Generation completed successfully.');
  } else {
    lines.push(`${warnings.length} warning(s) found:`);
    lines.push('');
    for (const w of warnings) {
      const prefix = w.emailId ? `[${w.emailId}]` : '[General]';
      lines.push(`  ${prefix} ${w.message}`);
    }
    lines.push('');
    lines.push('Review all warnings before uploading emails to your ESP.');
  }

  const reportPath = path.join(outputDir, CONFIG.reportFile);
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`✓ Generated: ${CONFIG.reportFile}`);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function checkMetadata(metadata, footers, found) {
  if (!found) {
    addWarning(null, 'Metadata section not found. All {{variables}} will appear unresolved in output.');
    return;
  }
  if (!metadata.studyName)      addWarning(null, 'Metadata: Study Name is missing.');
  if (!metadata.studyTeamEmail) addWarning(null, 'Metadata: Study Team Email is missing.');
  if (!metadata.portalLink)     addWarning(null, 'Metadata: Portal Link is missing. Button URLs will be unresolved.');
  if (!footers.system)          addWarning(null, 'Metadata: System Comms Footer is missing. System emails will have no footer.');
  if (!footers.marketing)       addWarning(null, 'Metadata: Marketing Footer is missing. Marketing emails will have no footer.');
}

function checkEmail(email) {
  // Required fields
  if (!email.subjectLine) {
    addWarning(email.id, 'Subject is empty.');
  }
  if (!email.emailContent) {
    addWarning(email.id, 'Email Content is empty.');
  }

  // Type field
  if (!email.type) {
    addWarning(email.id, 'Type is missing. Footer will default to marketing.');
  } else if (!['system', 'marketing'].includes(email.type.toLowerCase())) {
    addWarning(email.id, `Type "${email.type}" is not recognized (expected "System" or "Marketing"). Footer will default to marketing.`);
  }

  // Button marker / template mismatch
  const hasButton = /\\?\[ ?(LOG IN|VERIFY EMAIL|RESET PASSWORD) ?\\?\]/i.test(email.emailContent || '');
  const usesButtonTemplate = (email.template || '').toLowerCase().includes('button');
  if (hasButton && !usesButtonTemplate) {
    const templateDisplay = email.template ? `"${email.template}"` : '"template-basic" (default)';
    addWarning(email.id, `Contains a CTA button marker but Template is ${templateDisplay}. The button will not render — use template-with-button.`);
  }

  // Unknown variables in rendered fields
  const fieldsToCheck = [
    { name: 'Email Content', value: email.emailContent },
    { name: 'Email Header',  value: email.emailHeader  },
  ];
  for (const field of fieldsToCheck) {
    if (!field.value) continue;
    const found = [...field.value.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    const unknown = [...new Set(found)].filter(v => !METADATA_KEYS.includes(v));
    for (const varName of unknown) {
      addWarning(email.id, `"{{${varName}}}" in ${field.name} is not a known metadata variable and will appear unresolved in output. If this is an intentional ESP variable, this warning can be ignored.`);
    }
  }
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse metadata from the markdown file
 */
function parseMetadata(markdownContent) {
  const metadata = {};
  const footers = {};

  // Extract metadata section
  const metadataMatch = markdownContent.match(/## Metadata\n\n([\s\S]*?)(?=\n—|\n##)/);
  if (!metadataMatch) return { metadata, footers, found: false };

  const metadataText = metadataMatch[1];

  // Extract each field
  const studyNameMatch = metadataText.match(/\*\*Study Name\*\*:\s*(.+)/);
  if (studyNameMatch) metadata.studyName = studyNameMatch[1].trim();

  const emailMatch = metadataText.match(/\*\*Study Team Email\*\*:\s*(.+)/);
  if (emailMatch) metadata.studyTeamEmail = emailMatch[1].trim();

  const phoneMatch = metadataText.match(/\*\*Study Team Phone\*\*:\s*(.+)/);
  if (phoneMatch) metadata.studyTeamPhone = phoneMatch[1].trim();

  const portalMatch = metadataText.match(/\*\*Portal Link\*\*:\s*(.+)/);
  if (portalMatch) metadata.portalLink = portalMatch[1].trim();

  const addressMatch = metadataText.match(/\*\*Postal Address\*\*:\s*(.+)/);
  if (addressMatch) metadata.postalAddress = addressMatch[1].trim();

  // Extract footers
  const systemFooterMatch = metadataText.match(/\*\*System Comms Footer\*\*:\s*(.+)/);
  if (systemFooterMatch) footers.system = systemFooterMatch[1].trim();

  const marketingFooterMatch = metadataText.match(/\*\*Marketing Footer\*\*:\s*(.+)/);
  if (marketingFooterMatch) footers.marketing = marketingFooterMatch[1].trim();

  return { metadata, footers, found: true };
}

/**
 * Parse the markdown file and extract email communications
 */
function parseMarkdownEmails(markdownContent) {
  const emails = [];

  // Split by h2 headings (## CP1:, ## S1:, etc.)
  const sections = markdownContent.split(/^## /gm).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const titleLine = lines[0].trim();

    // Skip metadata section
    if (titleLine.toLowerCase().includes('metadata')) continue;

    // Extract ID and title - accepts any format "ID: Title"
    const match = titleLine.match(/^([^:]+):\s*(.+?)$/);
    if (!match) continue;

    const [, id, title] = match;
    const email = { id: id.trim(), title: title.trim() };

    // Extract fields using **Field**: pattern
    email.trigger = extractField(section, 'Trigger');
    email.timing = extractField(section, 'Timing');
    email.subjectLine = extractField(section, 'Subject');
    email.type = extractField(section, 'Type');
    email.template = extractField(section, 'Template');
    email.emailHeader = extractField(section, 'Email Header');

    // Extract email content (everything between **Email Content:** and next ** field)
    const emailContentMatch = section.match(/\*\*Email Content:\*\*\s*\n([\s\S]*?)(?=\n\*\*[A-Z]|\n—|$)/);
    if (emailContentMatch) {
      email.emailContent = emailContentMatch[1].trim();
    } else {
      email.emailContent = '';
    }

    // Extract SMS content
    const smsMatch = section.match(/\*\*SMS Content:\*\*\s*\n?([\s\S]*?)(?=\n\*\*[A-Z]|\n—|$)/);
    if (smsMatch) {
      email.smsContent = smsMatch[1].trim();
    } else {
      email.smsContent = '';
    }

    // Determine footer type from Type field
    email.footerType = email.type && email.type.toLowerCase() === 'system' ? 'system' : 'marketing';

    emails.push(email);
  }

  return emails;
}

/**
 * Extract a specific field from the markdown section
 * Handles both formats: **Field**: value OR **Field: value**
 */
function extractField(sectionText, fieldName) {
  // Try pattern 1: **Field**: value (colon outside bold)
  let regex = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+?)(?=\\n|$)`, 'i');
  let match = sectionText.match(regex);
  if (match) return match[1].trim();

  // Try pattern 2: **Field:** value (colon inside bold, no closing ** at end of value)
  regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
  match = sectionText.match(regex);
  return match ? match[1].trim() : '';
}

// ─── Generation ───────────────────────────────────────────────────────────────

/**
 * Convert markdown-style formatting to HTML
 */
function markdownToHtml(text, isFooter = false) {
  if (!text) return '';

  // Remove escaped brackets from markdown export
  text = text.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  // Convert markdown links [text](url) to HTML <a> tags
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#fff;text-decoration:underline">$1</a>');

  // Convert bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Remove button markers - they'll be handled by template placeholders
  // Button text will be extracted separately and passed as a variable
  // Handle both escaped \[ and regular [ brackets
  text = text.replace(/\\?\[ ?(LOG IN|VERIFY EMAIL|RESET PASSWORD) ?\\?\]/gi, '');

  // Convert line breaks - let template handle all formatting
  // Just convert newlines to <br> tags
  text = text.replace(/\n/g, '<br>');

  return text;
}

/**
 * Extract button text from email content
 */
function extractButtonInfo(emailContent) {
  // Handle both escaped \[ and regular [ brackets (markdown export may escape them)
  const buttonMatch = emailContent.match(/\\?\[ ?(LOG IN|VERIFY EMAIL|RESET PASSWORD) ?\\?\]/i);
  if (buttonMatch) {
    return {
      buttonText: buttonMatch[1],
      buttonUrl: '{{portalLink}}' // Default to portal link
    };
  }
  return null;
}

/**
 * Replace variables in text with actual values
 */
function replaceVariables(text, variables) {
  if (!variables) return text;

  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `{{${key}}}`);
  }
  return result;
}

/**
 * Generate HTML email from template
 */
function generateHtmlEmail(template, email, footer, variables) {
  // Extract button info and split content before converting to HTML
  const buttonInfo = extractButtonInfo(email.emailContent);

  // Split content at button location (if button exists)
  let contentBeforeButton = email.emailContent;
  let contentAfterButton = '';

  if (buttonInfo) {
    // Split at the button marker
    const buttonPattern = /\\?\[ ?(LOG IN|VERIFY EMAIL|RESET PASSWORD) ?\\?\]/i;
    const parts = email.emailContent.split(buttonPattern);
    // Trim whitespace/newlines to avoid extra spacing around button
    contentBeforeButton = (parts[0] || '').trim();
    // parts[1] is the button text, parts[2] is content after
    contentAfterButton = (parts[2] || '').trim();
  }

  // Add button info to variables if button exists
  const allVariables = { ...variables };
  if (buttonInfo) {
    allVariables.buttonText = buttonInfo.buttonText;
    // Resolve any variables in buttonUrl (e.g., {{portalLink}})
    allVariables.buttonUrl = replaceVariables(buttonInfo.buttonUrl, variables);
  }

  // Convert email header to HTML if it exists (optional field)
  let emailHeaderHtml = '';
  if (email.emailHeader) {
    emailHeaderHtml = markdownToHtml(email.emailHeader, false);
  }

  let emailContentHtml = markdownToHtml(contentBeforeButton, false);
  let closingTextHtml = markdownToHtml(contentAfterButton, false);
  let footerHtml = markdownToHtml(footer, true);

  // Replace variables if provided
  if (allVariables) {
    emailHeaderHtml = replaceVariables(emailHeaderHtml, allVariables);
    emailContentHtml = replaceVariables(emailContentHtml, allVariables);
    closingTextHtml = replaceVariables(closingTextHtml, allVariables);
    footerHtml = replaceVariables(footerHtml, allVariables);
  }

  // Add processed content to variables
  allVariables.emailHeader = emailHeaderHtml;
  allVariables.closingText = closingTextHtml;

  // Replace all occurrences of {{emailContent}}, {{closingText}}, and {{footer}}
  let html = template.replace(/\{\{emailContent\}\}/g, emailContentHtml);
  html = html.replace(/\{\{closingText\}\}/g, closingTextHtml);
  html = html.replace(/\{\{footer\}\}/g, footerHtml);

  // Also replace any remaining variables in the template itself (like portalUrl, portalLink, buttonText, buttonUrl)
  if (allVariables) {
    html = replaceVariables(html, allVariables);
  }

  return html;
}

/**
 * Load template file based on template filename
 */
function loadTemplate(templateFileName) {
  // If no template specified, use default
  if (!templateFileName) {
    templateFileName = CONFIG.defaultTemplate;
  }

  // Add .html extension if not present
  if (!templateFileName.endsWith('.html')) {
    templateFileName = templateFileName + '.html';
  }

  // Build full path
  const templatePath = path.join(CONFIG.templateDir, templateFileName);

  // Check if template file exists
  if (!fs.existsSync(templatePath)) {
    console.log(`⚠️  Template file not found: ${templateFileName}. Using default template.`);
    const defaultPath = path.join(CONFIG.templateDir, CONFIG.defaultTemplate);
    if (!fs.existsSync(defaultPath)) {
      throw new Error(`Default template file not found: ${CONFIG.defaultTemplate}`);
    }
    return fs.readFileSync(defaultPath, 'utf8');
  }

  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Save email to file
 */
function saveEmail(html, email, outputDir) {
  const filename = `${email.id.toLowerCase()}-${email.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`✓ Generated: ${filename}`);

  return filename;
}

/**
 * Generate a JSON data file with all emails
 */
function saveEmailsJson(emails, outputDir, language, locale, metadata) {
  const jsonPath = path.join(outputDir, 'emails-data.json');

  // Resolve variables in subject lines using metadata
  const resolvedEmails = emails.map(e => {
    const resolvedSubject = replaceVariables(e.subjectLine, metadata);
    return {
      id: e.id,
      title: e.title,
      subjectLine: resolvedSubject,
      trigger: e.trigger,
      timing: e.timing,
      template: e.template || CONFIG.defaultTemplate,
      emailContent: e.emailContent,
      smsContent: e.smsContent,
      footerType: e.footerType,
      type: e.type
    };
  });

  const data = {
    generatedAt: new Date().toISOString(),
    language: language,
    locale: locale,
    studyName: metadata.studyName || 'Unknown Study',
    emails: resolvedEmails
  };

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Generated: emails-data.json (${language})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Vibrent Email Generator\n');

  // Load languages
  const languages = loadLanguages();
  console.log(`Loaded ${languages.length} language(s): ${languages.map(l => l.code).join(', ')}\n`);

  // Create root output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Process each language
  for (const lang of languages) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processing: ${lang.name} (${lang.code})`);
    console.log('='.repeat(50) + '\n');

    // Clear warnings for each language
    warnings.length = 0;

    // Build path to language-specific markdown file
    const markdownFile = path.join(CONFIG.communicationsDir, lang.code, CONFIG.markdownFileTemplate);

    // Check if file exists
    if (!fs.existsSync(markdownFile)) {
      console.error(`❌ Error: Markdown file not found: ${markdownFile}`);
      console.log(`   Expected path: communications/${lang.code}/Communications.md\n`);
      continue;
    }

    // Read markdown file
    console.log(`Reading: ${markdownFile}`);
    const markdownContent = fs.readFileSync(markdownFile, 'utf8');

    // Parse metadata and footers from markdown
    console.log('Parsing metadata...');
    const { metadata, footers, found: metadataFound } = parseMetadata(markdownContent);
    console.log(`Study: ${metadata.studyName || 'Not found'}`);

    // Parse emails
    console.log('Parsing emails...');
    const emails = parseMarkdownEmails(markdownContent);
    console.log(`Found ${emails.length} emails`);

    if (emails.length === 0) {
      console.log('⚠️  No emails found. Skipping this language.');
      continue;
    }

    // Validate and collect warnings
    console.log('\nValidating...');
    checkMetadata(metadata, footers, metadataFound);
    for (const email of emails) {
      checkEmail(email);
    }

    // If warnings found, print them and prompt before generating anything
    if (warnings.length > 0) {
      printWarnings();
      const proceed = await promptContinue();
      if (!proceed) {
        console.log('\nSkipped. No files were generated for this language.');
        continue;
      }
      console.log('');
    } else {
      console.log('✓ No warnings.\n');
    }

    // Create language-specific output directory
    const langOutputDir = path.join(CONFIG.outputDir, lang.code);
    if (!fs.existsSync(langOutputDir)) {
      fs.mkdirSync(langOutputDir, { recursive: true });
    }

    // Generate HTML files
    console.log('Generating HTML files...');
    for (const email of emails) {
      // Load the appropriate template for this email
      const templateFileName = email.template || CONFIG.defaultTemplate;
      const template = loadTemplate(templateFileName);

      const footer = footers[email.footerType] || '';
      const html = generateHtmlEmail(template, email, footer, metadata);
      saveEmail(html, email, langOutputDir);
    }

    // Save JSON data file
    console.log('\nSaving JSON data...');
    saveEmailsJson(emails, langOutputDir, lang.code, lang.locale, metadata);

    // Save generation report
    console.log('Saving generation report...');
    saveReport(langOutputDir);

    console.log(`✅ Complete for ${lang.name}!`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('✅ All languages processed!');
  console.log(`Check the generated-emails/ directory for language folders`);
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  });
}

module.exports = { parseMarkdownEmails, generateHtmlEmail, markdownToHtml };
