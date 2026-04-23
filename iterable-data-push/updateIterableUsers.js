import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function updateUserSurveyVisible(userId, surveyType) {
  const url = `${BASE_URL}/users/update`;

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return { success: true, userId, result };
  } catch (error) {
    return { success: false, userId, error: error.message };
  }
}

async function updateMultipleUsers(userIds, surveyType) {
  console.log(`Starting update for ${userIds.length} users...`);
  console.log(`Setting ${surveyType} visible = false\n`);

  const results = [];

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    console.log(`[${i + 1}/${userIds.length}] Updating user: ${userId}`);

    const result = await updateUserSurveyVisible(userId, surveyType);
    results.push(result);

    if (result.success) {
      console.log(`  ✓ User ${userId} updated successfully`);
    } else {
      console.error(`  ✗ User ${userId} failed: ${result.error}`);
    }
  }

  console.log('\nUpdate Summary:');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);

  return results;
}

// Read survey type from command line argument
const surveyType = process.argv[2];
if (!surveyType) {
  console.error('Error: Please specify a survey type');
  console.error('Usage: npm run update-users -- "Monthly Survey"');
  console.error('       npm run update-users -- "Quarterly Survey"');
  console.error('       npm run update-users -- "Weekly Survey"');
  process.exit(1);
}

// Read userIds from file
const userIdsFile = path.join(__dirname, 'userIds.json');
const userIds = JSON.parse(fs.readFileSync(userIdsFile, 'utf-8'));

updateMultipleUsers(userIds, surveyType);
