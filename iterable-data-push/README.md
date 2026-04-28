# Iterable Data Reconciliation Tool

This tool reconciles two types of user data in Iterable: profile data (updates) and event data (tracking).

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Your API Key
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your Iterable API key:
   ```
   ITERABLE_API_KEY=your_actual_api_key_here
   ```

## Usage

The script supports three modes: `profile`, `events`, or `all`.

### Profile Updates

Updates user profile data (like address) by hiding a survey type:

```bash
npm run reconcile -- profile "Monthly Survey"
npm run reconcile -- profile "Quarterly Survey"
npm run reconcile -- profile "Weekly Survey"
```

The script will update each user's profile with:
- `visible: "false"` — Hides the survey
- `unlocked: "true"` — Keeps the survey unlocked

**Input file:** `userIds.json` (JSON array of user IDs)

### Event Tracking

Pushes event data (with timestamps and actions) for multiple users:

```bash
npm run reconcile -- events "path/to/events.csv"
```

**Input file:** CSV file with columns mapping to event fields:
- `userId` — User ID (required)
- `eventName` — Event name (required)
- `campaignId` — Campaign ID (optional)
- `templateId` — Template ID (optional)
- `createNewFields` — Boolean flag (optional)
- `createdAt` — Timestamp (optional)
- Any additional columns are treated as `dataFields`

Example CSV:
```csv
userId,eventName,eventStatus,eventSource,eventType
87609,userMilestoneEntry,submitted,kitReturnReminderDiscard,cuny_form_response
87610,userMilestoneEntry,submitted,kitReturnReminderDiscard,cuny_form_response
```

### Run Both Operations

To run profile updates and event tracking in sequence:

```bash
npm run reconcile -- all "Monthly Survey" "path/to/events.csv"
```

## Input Files

### userIds.json

List of user IDs to update (for profile mode). Format as a JSON array:

```json
[
  "31709",
  "31773",
  "31677"
]
```

### events.csv

Event data for tracking (for events mode). Required columns:
- `userId` — User ID
- `eventName` — Event name

Additional columns become custom `dataFields` in the event.

## Output

The script shows:
- Progress for each operation (✓ for success, ✗ for failure)
- A summary with successful and failed counts

Example:
```
Starting event push for 2 events...

[1/2] Pushing event for user: 87609, event: userMilestoneEntry
  ✓ Event pushed successfully
[2/2] Pushing event for user: 87610, event: userMilestoneEntry
  ✓ Event pushed successfully

Summary:
  Successful: 2
  Failed: 0
```

## Files

- **updateIterableUsers.js** — Main script handling both profile and event operations
- **userIds.json** — List of user IDs for profile updates
- **events.csv** — Event data for event tracking
- **.env** — Your Iterable API key (keep secret, never commit)
- **.env.example** — Template for the .env file
- **package.json** — Node dependencies

## Troubleshooting

### "No API key found"
Ensure `.env` has `ITERABLE_API_KEY=your_key_here` in the same directory as the script.

### CSV file not found
Check the file path and ensure the CSV exists at the specified location.

### Some operations failed
Check error messages in the output. Common issues: invalid user IDs, malformed CSV, or API errors.
