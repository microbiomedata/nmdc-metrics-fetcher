#!/usr/bin/env python3
"""
Analyze CSV file of institutional affiliations to:
1. Calculate total number of records
2. Identify US national laboratory records
3. Calculate non-national lab records
"""

import csv
import re
import sys

# Default CSV file path
DEFAULT_CSV_PATH = "Current_Affiliations.csv"

def analyze_affiliations(csv_file_path):
    """Analyze the affiliations CSV file."""
    
    # Define national laboratory patterns
    national_lab_patterns = [
        r'los alamos national laboratory',
        r'lawrence berkeley national laboratory',
        r'e o lawrence berkeley national laboratory',
        r'pacific northwest national laboratory',
        r'oak ridge national laboratory',
        r'lawrence livermore national laboratory',
        r'argonne national laboratory',
        r'national renewable energy laboratory',
        r'sandia national laboratories',
        r'environmental molecular sciences laboratory',
        r'joint genome institute',
        r'doe joint genome institute',
        r'national microbiome data collaborative'
    ]
    
    total_records = 0
    national_lab_records = 0
    national_lab_rows = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)  # Skip header
            
            for row_num, row in enumerate(csv_reader, start=2):
                if len(row) >= 2:
                    institution_name = row[0].strip()
                    try:
                        records_count = int(row[1])
                        total_records += records_count
                        
                        # Check if this is a national laboratory
                        institution_lower = institution_name.lower()
                        is_national_lab = any(
                            re.search(pattern, institution_lower) 
                            for pattern in national_lab_patterns
                        )
                        
                        if is_national_lab:
                            national_lab_records += records_count
                            national_lab_rows.append({
                                'row': row_num,
                                'name': institution_name,
                                'records': records_count,
                                'identifier_type': row[2] if len(row) > 2 else '',
                                'identifier': row[3] if len(row) > 3 else ''
                            })
                            
                    except ValueError:
                        print(f"Warning: Could not parse record count for row {row_num}: {row}")
                        
    except FileNotFoundError:
        print(f"Error: Could not find file {csv_file_path}")
        return
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    
    # Calculate non-national lab records
    non_national_lab_records = total_records - national_lab_records
    
    # Print results
    print("=== INSTITUTIONAL AFFILIATIONS ANALYSIS ===\n")
    
    print(f"Total records in CSV: {total_records:,}")
    print(f"National laboratory records: {national_lab_records:,}")
    print(f"Non-national laboratory records: {non_national_lab_records:,}")
    print(f"Percentage of national lab records: {(national_lab_records/total_records)*100:.1f}%\n")
    
    print(f"Number of national laboratory rows: {len(national_lab_rows)}")
    print("\n=== US NATIONAL LABORATORY ENTRIES ===")
    
    for entry in national_lab_rows:
        print(f"Row {entry['row']}: {entry['name']} - {entry['records']} records")
        if entry['identifier_type'] and entry['identifier']:
            print(f"    ID Type: {entry['identifier_type']}, ID: {entry['identifier']}")
    
    print(f"\n=== SUMMARY ===")
    print(f"• Found {len(national_lab_rows)} rows containing US national laboratories")
    print(f"• These {len(national_lab_rows)} rows represent {national_lab_records:,} total records")
    print(f"• Remaining {non_national_lab_records:,} records are from non-national lab institutions")

if __name__ == "__main__":
    # Use command-line argument if provided, otherwise use default path
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        csv_file = DEFAULT_CSV_PATH
    
    print(f"Analyzing CSV file: {csv_file}\n")
    analyze_affiliations(csv_file)
