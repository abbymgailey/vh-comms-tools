#!/usr/bin/env node

/**
 * Iterable Email Template Pusher
 *
 * This script reads generated email HTML files and pushes them to Iterable.
 * It tracks templateIds in iterable-manifest.json for future updates.
 *
 * Usage: node push-to-iterable.js [--update-all]
 *   --update-all: Re-upload all templates (overwrites existing ones)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  generatedEmailsDir: 'generated-emails',
  manifestFile: 'iterable-manifest.json',
};

// Load API key from .env file
function loadApiKey() {
  const envPath = path.join(__dirname, '.env');

  console.log(`[DEBUG] Looking for .env at: ${envPath}`);

  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found');
    console.log('   Please copy .env.example to .env and add your Iterable API key');
    process.exit(1);
  }

  console.log(`[DEBUG] .env file found at: ${envPath}`);

  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ITERABLE_API_KEY\s*=\s*(.+)/);

  if (!match || !match[1] || match[1].includes('your_api_key')) {
    console.error('❌ Error: ITERABLE_API_KEY not set in .env file');
    process.exit(1);
  }

  return match[1].trim();
}

// Load languages configuration
function loadLanguages() {
  const languagesPath = path.join(__dirname, 'languages.json');
  if (!fs.existsSync(languagesPath)) {
    console.error('❌ Error: languages.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(languagesPath, 'utf8')).languages;
}

// Load existing manifest
function loadManifest() {
  const manifestPath = path.join(__dirname, CONFIG.manifestFile);

  if (!fs.existsSync(manifestPath)) {
    return { templates: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.warn('⚠️  Could not parse manifest file, starting fresh');
    return { templates: {} };
  }
}

// Save manifest
function saveManifest(manifest) {
  const manifestPath = path.join(__dirname, CONFIG.manifestFile);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

// Make HTTP request to Iterable API
function makeRequest(method, endpoint, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.iterable.com/api/${endpoint}`);

    console.log(`\n   [DEBUG] Request Details:`);
    console.log(`   Method: ${method}`);
    console.log(`   Full URL: ${url.toString()}`);
    console.log(`   [DEBUG] Payload keys: ${Object.keys(payload).join(', ')}`);
    console.log(`   [DEBUG] API Key sent as header: YES`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
    };

    console.log(`   Path: ${options.path}`);

    const req = https.request(options, (res) => {
      console.log(`   [DEBUG] Response Status: ${res.statusCode}`);

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   [DEBUG] Response Body Length: ${data.length} chars`);
        if (data.length < 500) {
          console.log(`   [DEBUG] Full Response: ${data}`);
        } else {
          console.log(`   [DEBUG] Response (first 500 chars): ${data.substring(0, 500)}`);
        }

        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${response.msg || data}`));
          }
        } catch (e) {
          // If it's not JSON, it's an error response (HTML error page)
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   [DEBUG] Request Error: ${err.message}`);
      reject(err);
    });

    const body = JSON.stringify(payload);
    console.log(`   [DEBUG] Sending body: ${body.length} bytes`);
    req.write(body);
    req.end();
  });
}

// Fetch message types from Iterable
async function fetchMessageTypes(apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://api.iterable.com/api/messageTypes');

    console.log('\n[DEBUG] Fetching messageTypes from Iterable...');

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'api_key': apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[DEBUG] Message types fetched successfully`);
            resolve(response);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${response.msg || data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse messageTypes response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Push template to Iterable
async function pushTemplate(templatePath, templateName, apiKey, manifest, subjectLine, language, locale, emailType, messageTypeIds, campaignName) {
  try {
    console.log(`\n   [DEBUG] pushTemplate called:`);
    console.log(`   templatePath: ${templatePath}`);
    console.log(`   templateName: ${templateName}`);
    console.log(`   language: ${language}`);
    console.log(`   locale: ${locale}`);
    console.log(`   subjectLine: ${subjectLine}`);
    console.log(`   emailType: ${emailType}`);
    console.log(`   campaignName: ${campaignName}`);

    const html = fs.readFileSync(templatePath, 'utf8');
    console.log(`   [DEBUG] HTML file size: ${html.length} bytes`);

    // Use actual subject line from email data
    const subject = subjectLine || templateName;

    // Initialize template entry if it doesn't exist
    if (!manifest.templates[templateName]) {
      manifest.templates[templateName] = {};
    }

    const existingTemplate = manifest.templates[templateName][language];

    if (existingTemplate && !process.argv.includes('--update-all')) {
      console.log(`⏭️  Skipping [${language}] "${templateName}" (templateId: ${existingTemplate.templateId})`);
      return null;
    }

    // Generate a unique clientTemplateId (Iterable requires this)
    // Use language + templateName to create a unique ID
    const clientTemplateId = `${language}-${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // Determine messageTypeId based on email type
    let messageTypeId = null;
    if (messageTypeIds) {
      if (emailType && emailType.toLowerCase() === 'system') {
        // Look for transactional message type
        messageTypeId = messageTypeIds['transactional message'];
        console.log(`   [DEBUG] Using transactional messageTypeId: ${messageTypeId}`);
      } else {
        // Look for marketing message type
        messageTypeId = messageTypeIds['marketing message'];
        console.log(`   [DEBUG] Using marketing messageTypeId: ${messageTypeId}`);
      }
    }

    const payload = {
      clientTemplateId: clientTemplateId,
      name: campaignName,
      subject: subject,
      html: html,
      locale: locale,
    };

    // Add messageTypeId if available (only for transactional/system emails)
    // Marketing emails don't need explicit messageTypeId in upsert - they're handled by the payload structure
    if (messageTypeId !== null && emailType && emailType.toLowerCase() === 'system') {
      payload.messageTypeId = messageTypeId;
    }

    console.log(`   [DEBUG] clientTemplateId: ${clientTemplateId}`);
    console.log(`   [DEBUG] emailType: ${emailType}`);
    console.log(`   [DEBUG] Payload keys: ${Object.keys(payload).join(', ')}`);

    // Check if unsubscribe variable is present in HTML
    if (emailType && emailType.toLowerCase() === 'marketing') {
      const hasUnsubscribe = /{{(hostedUnsubscribeUrl|unsubscribeUrl|unsubscribeMessageTypeUrl)}}/i.test(html);
      console.log(`   [DEBUG] Marketing email contains unsubscribe variable: ${hasUnsubscribe}`);
      if (!hasUnsubscribe) {
        console.log(`   [DEBUG] HTML footer excerpt: ${html.substring(html.length - 500)}`);
      }
    }

    // Note: Don't include templateId in upsert—clientTemplateId is enough for idempotency
    if (existingTemplate && process.argv.includes('--update-all')) {
      console.log(`🔄 Updating [${language}] "${templateName}"...`);
    } else {
      console.log(`📤 Uploading [${language}] "${templateName}"...`);
    }

    // Use upsert endpoint for both creates and updates
    const endpoint = 'templates/email/upsert';
    const response = await makeRequest('POST', endpoint, payload, apiKey);

    // Extract templateId from response
    // Iterable returns: "Upserted 1 templates with IDs: 23053594"
    let templateId = null;
    if (response.msg) {
      const match = response.msg.match(/IDs?:\s*(\d+)/);
      if (match && match[1]) {
        templateId = match[1];
      }
    }

    if (templateId) {
      manifest.templates[templateName][language] = {
        templateId: templateId,
        locale: locale,
        uploadedAt: new Date().toISOString(),
        filePath: path.basename(templatePath),
      };
      console.log(`   ✓ templateId: ${templateId}`);
      return templateId;
    } else {
      throw new Error(`Could not extract templateId from API response: ${JSON.stringify(response)}`);
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

// Get email data from emails-data.json
function getEmailData() {
  const dataPath = path.join(__dirname, CONFIG.generatedEmailsDir, 'emails-data.json');

  if (!fs.existsSync(dataPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (e) {
    console.warn('⚠️  Could not parse emails-data.json');
    return {};
  }
}

// Main function
async function main() {
  console.log('Iterable Email Template Pusher\n');

  // Check if generated emails exist
  const emailsDir = path.join(__dirname, CONFIG.generatedEmailsDir);
  if (!fs.existsSync(emailsDir)) {
    console.error('❌ Error: generated-emails directory not found');
    console.log('   Run "node email-generator.js" first to generate templates');
    process.exit(1);
  }

  // Load API key
  const apiKey = loadApiKey();
  console.log('✓ Loaded API key from .env');
  console.log(`[DEBUG] API Key length: ${apiKey.length} chars, starts with: ${apiKey.substring(0, 10)}...`);

  // Load languages
  const languages = loadLanguages();
  console.log(`✓ Loaded ${languages.length} language(s): ${languages.map(l => l.code).join(', ')}`);
  console.log(`[DEBUG] Languages config: ${JSON.stringify(languages, null, 2)}\n`);

  // Load manifest
  const manifest = loadManifest();

  // Fetch message types from Iterable
  let messageTypeIds = {};
  try {
    const messageTypesResponse = await fetchMessageTypes(apiKey);
    // Parse response to extract transactional and marketing IDs
    // Response format: { messageTypes: [ { id: 1, name: "transactional" }, { id: 2, name: "marketing" } ] }
    if (messageTypesResponse.messageTypes && Array.isArray(messageTypesResponse.messageTypes)) {
      messageTypesResponse.messageTypes.forEach(mt => {
        if (mt.name && mt.id) {
          const key = mt.name.toLowerCase();
          messageTypeIds[key] = mt.id;
        }
      });
      console.log(`✓ Message types loaded: ${JSON.stringify(messageTypeIds)}\n`);
    }
  } catch (err) {
    console.warn(`⚠️  Could not fetch message types: ${err.message}`);
    console.log('   Templates will be created without messageTypeId\n');
  }

  // Push each language
  let uploadCount = 0;
  let skipCount = 0;

  for (const lang of languages) {
    const langDir = path.join(emailsDir, lang.code);

    // Skip if language directory doesn't exist
    if (!fs.existsSync(langDir)) {
      console.log(`⏭️  Skipping ${lang.name} (${lang.code}) — directory not found`);
      continue;
    }

    console.log(`\nProcessing: ${lang.name} (${lang.code})`);
    console.log('─'.repeat(50));

    // Get email data for this language
    const dataPath = path.join(langDir, 'emails-data.json');
    let emailData = {};
    if (fs.existsSync(dataPath)) {
      try {
        emailData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      } catch (e) {
        console.warn('⚠️  Could not parse emails-data.json');
      }
    }

    // Find all HTML files for this language
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.html'));
    console.log(`  [DEBUG] Files in ${langDir}: ${fs.readdirSync(langDir).join(', ')}`);
    console.log(`  [DEBUG] HTML files found: ${files.join(', ')}`);

    if (files.length === 0) {
      console.log(`  ⚠️  No HTML files found`);
      continue;
    }

    console.log(`  Found ${files.length} template(s)`);

    // Push each template for this language
    for (const file of files) {
      const filePath = path.join(langDir, file);

      // Extract email ID from filename (format: id-title.html)
      const emailId = file.split('-')[0].toUpperCase();

      // Try to get subject from email data
      const emailInfo = emailData.emails?.find(e => e.id === emailId);
      const templateName = emailInfo?.subjectLine || file.replace('.html', '');

      // Construct campaign name: "Study Name - EmailID: Email Title"
      const studyName = emailData.studyName || 'Unknown Study';
      const campaignName = `${studyName} - ${emailInfo?.id}: ${emailInfo?.title}`;

      const result = await pushTemplate(
        filePath,
        templateName,
        apiKey,
        manifest,
        emailInfo?.subjectLine,
        lang.code,
        lang.locale,
        emailInfo?.type,
        messageTypeIds,
        campaignName
      );

      if (result) {
        uploadCount++;
      } else if (manifest.templates[templateName]?.[lang.code]) {
        skipCount++;
      }
    }
  }

  // Save updated manifest
  saveManifest(manifest);

  // Summary
  console.log('\n' + '='.repeat(50));
  if (uploadCount > 0) {
    console.log(`✅ Uploaded/Updated: ${uploadCount} template(s)`);
  }
  if (skipCount > 0) {
    console.log(`⏭️  Skipped: ${skipCount} template(s)`);
  }
  console.log(`📋 Manifest saved to: ${CONFIG.manifestFile}`);
  console.log('\nNext time you generate emails, run:');
  console.log('  node push-to-iterable.js');
  console.log('This will update existing templates using stored templateIds.');
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  });
}

module.exports = { loadManifest, saveManifest, pushTemplate };
