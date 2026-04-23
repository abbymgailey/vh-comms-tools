# Iterable Data Push Tool

This tool allows you to update user data in Iterable for multiple users sequentially.

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

### Update a Survey Type

Use the script to update any survey type by specifying it as an argument:

```bash
npm run update-users -- "Monthly Survey"
npm run update-users -- "Quarterly Survey"
npm run update-users -- "Weekly Survey"
```

### What Gets Updated

The script updates the specified survey with:
- `visible: "false"` — Hides the survey
- `unlocked: "true"` — Keeps the survey unlocked

## Input File

### userIds.json

This file contains the list of user IDs to update. Format it as a JSON array:

```json
[
  "31709",
  "31773",
  "31677"
]
```

You can paste a plain list of IDs and reformat them into this JSON array format.

## Example Workflow

1. **Get your user IDs** from wherever they're stored (CSV, database, etc.)
2. **Add them to userIds.json** in the format above
3. **Run the update** for the survey type you want to modify:
   ```bash
   npm run update-users -- "Monthly Survey"
   ```
4. **Check the output** for success/failure count

## Output

The script will show:
- Progress for each user (✓ for success, ✗ for failure)
- A summary with successful and failed counts

Example:
```
Starting update for 95 users...
Setting Monthly Survey visible = false

[1/95] Updating user: 31709
  ✓ User 31709 updated successfully
[2/95] Updating user: 31773
  ✓ User 31773 updated successfully
...

Update Summary:
  Successful: 95
  Failed: 0
```

## Files

- **updateIterableUsers.js** — Main script that handles the updates
- **userIds.json** — List of user IDs to update
- **.env** — Your Iterable API key (keep this secret, never commit it)
- **.env.example** — Template for the .env file
- **package.json** — Node dependencies

## Troubleshooting

### "No API key found"
Make sure your `.env` file has `ITERABLE_API_KEY=your_key_here` and is in the same directory as the script.

### Updates are taking a long time
The script processes users sequentially, so it may take a few minutes for large lists. This is intentional to avoid overwhelming the API.

### Some users failed
Check the error messages in the output. Common issues include invalid user IDs or API errors.
