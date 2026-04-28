import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.ITERABLE_API_KEY;
const BASE_URL = 'https://api.iterable.com/api';

if (!API_KEY) {
  console.error('Error: ITERABLE_API_KEY not found in .env file');
  process.exit(1);
}

console.log(`API Key loaded: ${API_KEY.length} characters\n`);

// Shared utility for making API calls
async function makeApiCall(endpoint, payload) {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log(`  Status: ${response.status}, Response:`, JSON.stringify(result));

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(result)}`);
    }

    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Profile update operation
async function updateUserProfile(userId, surveyType) {
  const payload = {
    userId: userId,
    mergeNestedObjects: true,
    dataFields: {
      formTracking: {
        [surveyType]: {
          visible: 'false',
          unlocked: 'true',
        },
      },
    },
  };

  const result = await makeApiCall('/users/update', payload);
  return { ...result, userId };
}

async function updateMultipleProfiles(userIds, surveyType) {
  console.log(`Starting profile update for ${userIds.length} users...`);
  console.log(`Setting ${surveyType} visible = false\n`);

  const results = [];

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    console.log(`[${i + 1}/${userIds.length}] Updating user: ${userId}`);

    const result = await updateUserProfile(userId, surveyType);
    results.push(result);

    if (result.success) {
      console.log(`  ✓ User ${userId} updated successfully`);
    } else {
      console.error(`  ✗ User ${userId} failed: ${result.error}`);
    }
  }

  printSummary(results);
  return results;
}

// Event push operation
async function pushUserEvent(eventData) {
  console.log(`  Payload:`, JSON.stringify(eventData, null, 2));
  const result = await makeApiCall('/events/track', eventData);
  return { ...result, userId: eventData.userId, eventName: eventData.eventName };
}

async function pushMultipleEvents(events) {
  console.log(`Starting event push for ${events.length} events...`);
  console.log('');

  const results = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { userId, eventName } = event;
    console.log(`[${i + 1}/${events.length}] Pushing event for user: ${userId}, event: ${eventName}`);

    const result = await pushUserEvent(event);
    results.push(result);

    if (result.success) {
      console.log(`  ✓ Event pushed successfully`);
    } else {
      console.error(`  ✗ Event push failed: ${result.error}`);
    }
  }

  printSummary(results);
  return results;
}

// Helper function to print summary
function printSummary(results) {
  console.log('\nSummary:');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
}

// Read CSV file and return events
function readEventsFromCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record) => {
    // Convert createdAt to Unix timestamp in seconds
    let createdAtTimestamp = 0;
    if (record.createdAt) {
      const dateRegex = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
      const match = record.createdAt.match(dateRegex);
      if (match) {
        const isoString = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
        createdAtTimestamp = Math.floor(new Date(isoString).getTime() / 1000);
      }
    }

    // Map CSV columns to event payload structure
    const event = {
      userId: record.userId,
      eventName: record.eventName,
      eventType: 'customEvent',
      dataFields: {},
    };

    // Add createdAt at top level as Unix timestamp
    if (createdAtTimestamp) {
      event.createdAt = createdAtTimestamp;
    }

    // Add optional fields if present
    if (record.campaignId) event.campaignId = parseInt(record.campaignId);
    if (record.createNewFields) event.createNewFields = record.createNewFields === 'true';
    if (record.templateId) event.templateId = parseInt(record.templateId);

    // Collect all other columns as dataFields
    const excludedKeys = [
      'userId',
      'eventName',
      'campaignId',
      'createNewFields',
      'createdAt',
      'templateId',
      'email',
      'id',
    ];

    Object.entries(record).forEach(([key, value]) => {
      if (!excludedKeys.includes(key) && value) {
        event.dataFields[key] = value;
      }
    });

    return event;
  });
}

// CLI entry point
const mode = process.argv[2];

if (!mode) {
  console.error('Error: Please specify a mode');
  console.error('Usage:');
  console.error('  npm run update-users -- profile "Monthly Survey"');
  console.error('  npm run update-users -- events "path/to/events.csv"');
  console.error('  npm run update-users -- all "Monthly Survey" "path/to/events.csv"');
  process.exit(1);
}

(async () => {
  try {
    if (mode === 'profile') {
      const surveyType = process.argv[3];
      if (!surveyType) {
        console.error('Error: Please specify a survey type for profile mode');
        console.error('Usage: npm run update-users -- profile "Monthly Survey"');
        process.exit(1);
      }

      const userIdsFile = path.join(__dirname, 'userIds.json');
      const userIds = JSON.parse(fs.readFileSync(userIdsFile, 'utf-8'));
      await updateMultipleProfiles(userIds, surveyType);
    } else if (mode === 'events') {
      const csvFile = process.argv[3];
      if (!csvFile) {
        console.error('Error: Please specify a CSV file path for events mode');
        console.error('Usage: npm run update-users -- events "path/to/events.csv"');
        process.exit(1);
      }

      const events = readEventsFromCSV(csvFile);
      await pushMultipleEvents(events);
    } else if (mode === 'all') {
      const surveyType = process.argv[3];
      const csvFile = process.argv[4];

      if (!surveyType || !csvFile) {
        console.error('Error: Please specify both survey type and CSV file for all mode');
        console.error('Usage: npm run update-users -- all "Monthly Survey" "path/to/events.csv"');
        process.exit(1);
      }

      const userIdsFile = path.join(__dirname, 'userIds.json');
      const userIds = JSON.parse(fs.readFileSync(userIdsFile, 'utf-8'));

      console.log('=== Running Profile Updates ===\n');
      await updateMultipleProfiles(userIds, surveyType);

      console.log('\n=== Running Event Pushes ===\n');
      const events = readEventsFromCSV(csvFile);
      await pushMultipleEvents(events);
    } else {
      console.error(`Error: Unknown mode "${mode}"`);
      console.error('Valid modes: profile, events, all');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
})();
