#!/usr/bin/env python3
"""
CSV Encoding Converter
Converts CSV files to UTF-8 encoding for proper upload to the CRM system.
"""

import sys
import os
from pathlib import Path

def convert_csv_to_utf8(input_file, output_file=None):
    """
    Convert a CSV file to UTF-8 encoding.
    
    Args:
        input_file: Path to the input CSV file
        output_file: Path to the output file (optional, defaults to input_file_utf8.csv)
    """
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        return False
    
    if output_file is None:
        input_path = Path(input_file)
        output_file = input_path.parent / f"{input_path.stem}_utf8{input_path.suffix}"
    
    # Try different encodings
    encodings_to_try = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1', 'windows-1252']
    
    for encoding in encodings_to_try:
        try:
            print(f"Trying to read with {encoding} encoding...")
            with open(input_file, 'r', encoding=encoding) as f:
                content = f.read()
            
            print(f"Successfully read with {encoding} encoding!")
            
            # Write as UTF-8
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Converted file saved as: {output_file}")
            return True
            
        except UnicodeDecodeError:
            print(f"Failed to read with {encoding} encoding")
            continue
        except Exception as e:
            print(f"Error with {encoding} encoding: {e}")
            continue
    
    print("Error: Could not decode the file with any of the supported encodings.")
    return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_csv_encoding.py <input_file> [output_file]")
        print("Example: python convert_csv_encoding.py lead.CSV lead_utf8.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_csv_to_utf8(input_file, output_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
