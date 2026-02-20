#!/usr/bin/env python3
import json
import csv
import sys

DEFAULT_FIELDS = ['id', 'name', 'enabled', 'triggerEventNames']

def extract_journey_data(json_file, output_file, fields):
    with open(json_file, 'r') as f:
        data = json.load(f)

    journeys = data.get('journeys', [])

    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fields)
        writer.writeheader()

        for journey in journeys:
            row = {}
            for field in fields:
                value = journey.get(field, '')
                if isinstance(value, list):
                    value = ', '.join(str(v) for v in value)
                row[field] = value
            writer.writerow(row)

    print(f"Extracted {len(journeys)} journeys to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_journeys_generic.py <input_json> <output_csv> [field1 field2 ...]")
        print(f"Default fields: {', '.join(DEFAULT_FIELDS)}")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    fields = sys.argv[3:] if len(sys.argv) > 3 else DEFAULT_FIELDS

    extract_journey_data(input_file, output_file, fields)
