# Journey Data Extractor

This script pulls data from a JSON file exported from Iterable and saves it as a `.csv` file that can be opened in Excel or Google Sheets.

Instead of generating the JSON export through Iterable's UI, you can also request the data directly from the terminal using an API call. Both approaches are covered below.

---

## Before You Start

Make sure you have Python installed. To check, open your terminal and type:

```
python3 --version
```

If you see a version number (e.g., `Python 3.11.0`), you're good to go.

---

## Navigating to the Right Folder

Before running the script, you need to be in the folder where the script lives. In your terminal, type:

```
cd path/to/vh-iterable-investigation
```

> **Tip:** You can drag the folder from Finder into the terminal window and it will fill in the path for you.

---

## Running the Script

The basic structure of the command is:

```
python3 extract_journeys_generic.py <input_file> <output_file> [fields]
```

- `<input_file>` — the path to the JSON file you want to extract data from
- `<output_file>` — the path and name of the `.csv` file that will be created
- `[fields]` — the column names you want to include, separated by spaces (optional — see defaults below)

---

## Example

```
python3 extract_journeys_generic.py "st jude 021826/stjude_journeys_021826" "st jude 021826/stjude_journeys_extracted.csv" id name enabled triggerEventNames
```

This will create a CSV with four columns: `id`, `name`, `enabled`, and `triggerEventNames`.

> **Note:** If your file or folder name contains spaces, wrap the path in quotes (as shown above).

---

## Default Fields

If you don't specify any fields, the script will automatically use these four:

- `id`
- `name`
- `enabled`
- `triggerEventNames`

So this command:

```
python3 extract_journeys_generic.py "st jude 021826/stjude_journeys_021826" "st jude 021826/output.csv"
```

...produces the same result as spelling out those four fields manually.

---

## Available Fields

These are all the fields available in the JSON file:

| Field name | Description |
|---|---|
| `id` | Unique journey ID |
| `name` | Journey name |
| `enabled` | Whether the journey is active (`true` or `false`) |
| `triggerEventNames` | Event(s) that trigger the journey |
| `journeyType` | Publication status (e.g., `Published`) |
| `createdAt` | When the journey was created (raw timestamp) |
| `updatedAt` | When the journey was last updated (raw timestamp) |
| `isArchived` | Whether the journey has been archived |
| `simultaneousLimit` | How many times a user can be in the journey at once |
| `lifetimeLimit` | How many times a user can enter the journey total |
| `description` | Journey description (often blank) |

> **Note:** Field names are case-sensitive. Type them exactly as shown above.

---

## Getting the JSON File via API Call

Instead of exporting the JSON through Iterable's UI, you can fetch it directly from the terminal. This uses a tool called `curl`, which is a built-in terminal command for making requests to web services — think of it like typing a URL into a browser, except the response comes back as data instead of a webpage.

### What You'll Need

- Your Iterable API key (a long string of letters and numbers provided by the vendor)
- The name you want to give the output file

### Step 1 — Make the API Call and Save the Response

Copy this command, replace `YOUR_API_KEY` with your actual key, and replace `output_filename` with whatever you want to name the file:

```
curl -X GET "https://api.iterable.com/api/journeys?pageSize=50&sort=id" -H "Api-Key: YOUR_API_KEY" -o output_filename
```

Keep the entire command on one line — breaking it across multiple lines can cause errors.

Breaking this down:
- `curl` — the tool that makes the request
- `-X GET` — tells curl this is a "read" request (you're fetching data, not sending it)
- The URL in quotes — the Iterable endpoint that returns journey data; `pageSize=50` sets how many results to return and `sort=id` orders them by ID
- `-H "Api-Key: YOUR_API_KEY"` — the `-H` flag adds a header to the request; this is how Iterable verifies who you are
- `-o output_filename` — the `-o` flag saves the response to a file instead of printing it to the screen

You can name the output file whatever you like. Adding a `.json` extension (e.g., `output_filename.json`) is optional but recommended — it helps identify the file type at a glance and doesn't affect the content.

**Example:**

```
curl -X GET "https://api.iterable.com/api/journeys?pageSize=50&sort=id" -H "Api-Key: abc123xyz" -o stjude_journeys_021826.json
```

> **Note:** If Iterable's data is hosted in Europe, use `https://api.eu.iterable.com` instead of `https://api.iterable.com`.

> **Note:** `pageSize=50` returns up to 50 journeys. If the account has more than 50, additional steps are needed to retrieve all of them — flag this if it comes up.

### Step 2 — Run the Extraction Script

Once you have the JSON file saved, run the script as described in the sections below. For example:

```
python3 extract_journeys_generic.py "st jude 021826/stjude_journeys_021826" "st jude 021826/stjude_journeys_extracted.csv" id name enabled triggerEventNames
```

---

## Troubleshooting

**"command not found: python"**
Use `python3` instead of `python`.

**"No such file or directory"**
Double-check your file path. If the folder or file name has spaces in it, make sure the path is wrapped in quotes.

**The CSV looks empty**
Make sure the field names you typed match exactly what's listed in the Available Fields table above.

**The API call returns an error or empty data**
Double-check that your API key is correct and that you have permission to access journey data. If you see a `429` error, you've hit a rate limit — wait a moment and try again.
