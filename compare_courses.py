#!/usr/bin/env python3
"""Compare CSV course data with database courses."""

import csv
import re
import subprocess
import sys
from collections import defaultdict

# ============================================================
# 1. Parse CSV
# ============================================================

CSV_PATH = r"C:\Users\dell\Downloads\COURSE UNIT.xlsx - Sheet1.csv"

def read_csv(path):
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        return [row for row in reader]

def normalize_code(code):
    """Normalize course code: strip, collapse spaces, uppercase."""
    code = code.strip()
    code = re.sub(r'\s+', ' ', code)
    # Remove tab characters
    code = code.replace('\t', '')
    return code.upper()

def extract_programme_courses(rows):
    """Extract courses from each programme section of the CSV."""
    programmes = {}
    
    # Section definitions based on analysis of the CSV
    # Each section: (name, credit_row, prefix_row, number_row)
    sections = [
        ("BAM ND", 3, 4, 5),         # lines 4-6 (0-indexed: 3-5)
        ("BAM HND", 9, 10, 11),       # lines 10-12 (0-indexed: 9-11)
        ("ACCOUNTANCY ND", None, None, None),  # Special parsing
        ("ACCOUNTANCY HND", 20, 21, 22),  # lines 21-23 (0-indexed: 20-22)
        ("HND STATISTICS", 27, 28, 29),  # lines 28-30 (0-indexed: 27-29)
        ("ND STATISTICS", 34, 35, 36),   # lines 35-37 (0-indexed: 34-36)
        ("NCC", 41, 42, 43),            # lines 42-44 (0-indexed: 41-43)
        ("AIT", 46, 47, 48),            # lines 47-49 (0-indexed: 46-48)
        ("COMPUTER SCIENCE ND", 53, 54, 55),  # lines 54-56 (0-indexed: 53-55)
    ]
    
    def parse_standard_section(credit_row_idx, prefix_row_idx, number_row_idx, rows):
        """Parse a standard 3-row section."""
        courses = []
        credit_cells = rows[credit_row_idx]
        prefix_cells = rows[prefix_row_idx]
        number_cells = rows[number_row_idx]
        
        max_cols = max(len(credit_cells), len(prefix_cells), len(number_cells))
        
        for i in range(max_cols):
            credit = credit_cells[i].strip() if i < len(credit_cells) else ""
            prefix = prefix_cells[i].strip() if i < len(prefix_cells) else ""
            number = number_cells[i].strip() if i < len(number_cells) else ""
            
            # Skip empty entries
            if not prefix and not number:
                continue
            # Skip non-course entries
            if prefix in ("CO", "GP", "PROJECT", "") and not number:
                continue
            if credit and not credit.replace(".", "").isdigit():
                continue
            
            # Build course code
            prefix_clean = normalize_code(prefix)
            number_clean = normalize_code(number)
            
            if not prefix_clean or not number_clean:
                continue
            
            # Skip if credit is not a valid number
            try:
                credit_val = int(credit) if credit else 0
            except ValueError:
                continue
            
            code = f"{prefix_clean} {number_clean}"
            code = normalize_code(code)
            
            courses.append({
                "code": code,
                "credit_units": credit_val,
                "prefix": prefix_clean,
                "number": number_clean,
            })
        
        return courses
    
    # Parse BAM ND
    programmes["BAM ND"] = parse_standard_section(3, 4, 5, rows)
    
    # Parse BAM HND (skip HND II header row at index 8)
    programmes["BAM HND"] = parse_standard_section(9, 10, 11, rows)
    
    # Parse ACCOUNTANCY HND
    programmes["ACCOUNTANCY HND"] = parse_standard_section(20, 21, 22, rows)
    
    # Parse HND STATISTICS
    programmes["HND STATISTICS"] = parse_standard_section(27, 28, 29, rows)
    
    # Parse ND STATISTICS
    programmes["ND STATISTICS"] = parse_standard_section(34, 35, 36, rows)
    
    # Parse NCC
    programmes["NCC"] = parse_standard_section(41, 42, 43, rows)
    
    # Parse AIT
    programmes["AIT"] = parse_standard_section(46, 47, 48, rows)
    
    # Parse COMPUTER SCIENCE ND
    programmes["COMPUTER SCIENCE ND"] = parse_standard_section(53, 54, 55, rows)
    
    # Parse ACCOUNTANCY ND (special format - mixed rows)
    # Line 17 has combined codes for ND I courses
    acc_nd_courses = []
    
    # ND I courses from line 17 (combined format)
    line17 = rows[16]  # 0-indexed
    line16 = rows[15]  # credit units
    
    # ND I: first ~10 courses on line 17 with combined codes
    # Format: "BFN 112", "ACC 111", etc.
    nd1_combined_codes = []
    for cell in line17:
        cell = cell.strip()
        if not cell:
            continue
        # Check if it looks like a combined course code (prefix + number)
        if re.match(r'^[A-Z]{2,4}\s*\d{3}[A-Za-z]?$', cell.upper().replace('\t', '')):
            nd1_combined_codes.append(normalize_code(cell))
    
    # ND I credit units from line 16 (first entries before empty or "ND II")
    nd1_credits = []
    for cell in line16:
        cell = cell.strip()
        if not cell:
            continue
        if "ND II" in cell.upper():
            break
        try:
            nd1_credits.append(int(cell))
        except ValueError:
            continue
    
    # Match ND I courses with credits
    for i, code in enumerate(nd1_combined_codes):
        credit = nd1_credits[i] if i < len(nd1_credits) else 0
        prefix_match = re.match(r'^([A-Z]+)', code)
        number_match = re.search(r'(\d+[A-Z]*)$', code)
        if prefix_match and number_match:
            acc_nd_courses.append({
                "code": code,
                "credit_units": credit,
                "prefix": prefix_match.group(1),
                "number": number_match.group(1),
            })
    
    # ND II courses from lines 18-19
    line18 = rows[17]  # dept codes
    line19 = rows[18]  # numbers
    
    # Find where ND II courses start (after many empty cells)
    nd2_start = None
    for i, cell in enumerate(line18):
        if cell.strip() and nd2_start is None:
            nd2_start = i
    
    if nd2_start is not None:
        for i in range(nd2_start, max(len(line18), len(line19))):
            prefix = line18[i].strip() if i < len(line18) else ""
            number = line19[i].strip() if i < len(line19) else ""
            
            if not prefix or not number:
                continue
            
            prefix_clean = normalize_code(prefix)
            number_clean = normalize_code(number)
            code = f"{prefix_clean} {number_clean}"
            code = normalize_code(code)
            
            # ND II credit units come from line 17 trailing numbers
            # This is complex, skip credit matching for now
            acc_nd_courses.append({
                "code": code,
                "credit_units": 0,  # Will need manual verification
                "prefix": prefix_clean,
                "number": number_clean,
            })
    
    programmes["ACCOUNTANCY ND"] = acc_nd_courses
    
    return programmes

# ============================================================
# 2. Fetch database courses
# ============================================================

def fetch_db_courses():
    """Fetch courses from database via SSH."""
    cmd = (
        'ssh -o StrictHostKeyChecking=no deploy@147.93.84.90 '
        '"mysql -u portal_user -p\'StrongPassword123!\' school_portal '
        '-e \'SELECT id, TRIM(code) as code, credit_units, name FROM courses ORDER BY TRIM(code);\'"'
    )
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    
    courses = {}
    for line in result.stdout.strip().split('\n')[1:]:  # Skip header
        if not line.strip():
            continue
        parts = line.split('\t')
        if len(parts) >= 3:
            try:
                course_id = int(parts[0].strip())
            except ValueError:
                continue
            code = parts[1].strip()
            try:
                credit = int(parts[2].strip())
            except ValueError:
                credit = 0
            name = parts[3].strip() if len(parts) > 3 else ""
            
            # Normalize the code
            norm_code = normalize_code(code)
            courses[norm_code] = {
                "id": course_id,
                "code": code,
                "normalized_code": norm_code,
                "credit_units": credit,
                "name": name,
            }
    
    return courses

def fetch_db_programmes():
    """Fetch programmes from database."""
    cmd = (
        'ssh -o StrictHostKeyChecking=no deploy@147.93.84.90 '
        '"mysql -u portal_user -p\'StrongPassword123!\' school_portal '
        '-e \'SELECT id, name, code, dept_id FROM programmes ORDER BY id;\'"'
    )
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    
    programmes = []
    for line in result.stdout.strip().split('\n')[1:]:
        if not line.strip():
            continue
        parts = line.split('\t')
        if len(parts) >= 2:
            programmes.append({
                "id": int(parts[0]),
                "name": parts[1],
                "code": parts[2] if len(parts) > 2 else "",
                "dept_id": parts[3] if len(parts) > 3 else "",
            })
    return programmes

def fetch_db_departments():
    """Fetch departments from database."""
    cmd = (
        'ssh -o StrictHostKeyChecking=no deploy@147.93.84.90 '
        '"mysql -u portal_user -p\'StrongPassword123!\' school_portal '
        '-e \'SELECT id, name FROM departments ORDER BY id;\'"'
    )
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    
    depts = {}
    for line in result.stdout.strip().split('\n')[1:]:
        if not line.strip():
            continue
        parts = line.split('\t')
        if len(parts) >= 2:
            depts[int(parts[0])] = parts[1]
    return depts

# ============================================================
# 3. Map CSV programmes to DB departments
# ============================================================

# Mapping CSV programme names to database department codes/prefixes
PROGRAMME_MAP = {
    "BAM ND": {"csv_prefix": "BAM", "db_dept": "Business Administration", "level": "ND", "db_programme": "OND Business Administration"},
    "BAM HND": {"csv_prefix": "BAM", "db_dept": "Business Administration", "level": "HND", "db_programme": "HND Business Administration"},
    "ACCOUNTANCY ND": {"csv_prefix": "ACC", "db_dept": "Accountancy", "level": "ND", "db_programme": "OND Accountancy"},
    "ACCOUNTANCY HND": {"csv_prefix": "ACC", "db_dept": "Accountancy", "level": "HND", "db_programme": "HND Accountancy"},
    "HND STATISTICS": {"csv_prefix": "STA", "db_dept": "Statistics", "level": "HND", "db_programme": "HND Statistics"},
    "ND STATISTICS": {"csv_prefix": "STA", "db_dept": "Statistics", "level": "ND", "db_programme": "OND Statistics"},
    "NCC": {"csv_prefix": "NCC", "db_dept": "Networking and cloud computing", "level": "ND", "db_programme": "HND Networking and cloud computing"},
    "AIT": {"csv_prefix": "AIT", "db_dept": "Artificial Intelligence", "level": "ND", "db_programme": "HND Artificial Intelligence"},
    "COMPUTER SCIENCE ND": {"csv_prefix": "COM", "db_dept": "Computer Science", "level": "ND", "db_programme": "OND Computer Science"},
}

# Course prefixes that belong to general studies (GNS) or other shared depts
SHARED_PREFIXES = {"GNS", "MTH", "STA", "ECO", "OTM", "EED", "PHY", "VSA", "QTT", "SIW", "RMD", "ENG", "MAT"}

# ============================================================
# 4. Comparison logic
# ============================================================

def compare_courses(csv_courses, db_courses):
    """Compare CSV courses with database courses."""
    
    # Normalize all DB course codes
    db_by_norm = {}
    for code, info in db_courses.items():
        db_by_norm[normalize_code(code)] = info
    
    # Normalize CSV course codes
    csv_by_norm = {}
    for c in csv_courses:
        norm = normalize_code(c["code"])
        csv_by_norm[norm] = c
    
    # Find missing (in CSV but not in DB)
    missing = []
    for norm_code, csv_info in csv_by_norm.items():
        if norm_code not in db_by_norm:
            missing.append(csv_info)
    
    # Find extra (in DB but not in CSV)
    extra = []
    for norm_code, db_info in db_by_norm.items():
        if norm_code not in csv_by_norm:
            extra.append(db_info)
    
    # Find credit mismatches
    mismatches = []
    for norm_code in csv_by_norm:
        if norm_code in db_by_norm:
            csv_credit = csv_by_norm[norm_code]["credit_units"]
            db_credit = db_by_norm[norm_code]["credit_units"]
            if csv_credit > 0 and csv_credit != db_credit:
                mismatches.append({
                    "code": norm_code,
                    "csv_credit": csv_credit,
                    "db_credit": db_credit,
                    "csv_name": csv_by_norm[norm_code].get("name", ""),
                    "db_name": db_by_norm[norm_code].get("name", ""),
                })
    
    return missing, extra, mismatches

# ============================================================
# 5. Main
# ============================================================

def main():
    print("=" * 80)
    print("COURSE COMPARISON: CSV vs DATABASE")
    print("=" * 80)
    
    # Read CSV
    print("\n[1] Reading CSV file...")
    rows = read_csv(CSV_PATH)
    print(f"    Read {len(rows)} rows")
    
    # Parse CSV
    print("\n[2] Parsing CSV programme sections...")
    csv_programmes = extract_programme_courses(rows)
    
    for prog_name, courses in csv_programmes.items():
        print(f"    {prog_name}: {len(courses)} courses")
        for c in courses:
            print(f"      {c['code']} (credit: {c['credit_units']})")
    
    # Fetch database data
    print("\n[3] Fetching database courses...")
    db_courses = fetch_db_courses()
    print(f"    Found {len(db_courses)} courses in database")
    
    print("\n[4] Fetching database programmes...")
    db_programmes = fetch_db_programmes()
    for p in db_programmes:
        print(f"    {p['name']} ({p['code']})")
    
    print("\n[5] Fetching database departments...")
    db_depts = fetch_db_departments()
    for did, dname in db_depts.items():
        print(f"    {did}: {dname}")
    
    # Compare per programme
    print("\n" + "=" * 80)
    print("COMPARISON RESULTS")
    print("=" * 80)
    
    # For each CSV programme, find matching DB courses
    all_missing = []
    all_extra = []
    all_mismatches = []
    
    for prog_name, csv_courses in csv_programmes.items():
        prog_info = PROGRAMME_MAP.get(prog_name, {})
        csv_prefix = prog_info.get("csv_prefix", "")
        
        # Filter DB courses by prefix matching the programme
        # Include courses with the programme's prefix AND shared prefixes
        relevant_db = {}
        for norm_code, db_info in db_courses.items():
            course_prefix = re.match(r'^([A-Z]+)', norm_code)
            if course_prefix:
                p = course_prefix.group(1)
                if p == csv_prefix or p in SHARED_PREFIXES:
                    relevant_db[norm_code] = db_info
        
        # Also include CSV courses with shared prefixes
        relevant_csv = []
        for c in csv_courses:
            course_prefix = re.match(r'^([A-Z]+)', normalize_code(c["code"]))
            if course_prefix:
                p = course_prefix.group(1)
                if p == csv_prefix or p in SHARED_PREFIXES:
                    relevant_csv.append(c)
        
        missing, extra, mismatches = compare_courses(relevant_csv, relevant_db)
        
        print(f"\n{'-' * 60}")
        print(f"PROGRAMME: {prog_name}")
        print(f"  DB Programme: {prog_info.get('db_programme', 'N/A')}")
        print(f"  DB Department: {prog_info.get('db_dept', 'N/A')}")
        print(f"  CSV courses: {len(relevant_csv)}, DB courses: {len(relevant_db)}")
        print(f"{'-' * 60}")
        
        if missing:
            print(f"\n  [X] MISSING FROM DATABASE ({len(missing)} courses):")
            print(f"  {'Code':<15} {'Credit':<8}")
            print(f"  {'-'*15} {'-'*8}")
            for c in sorted(missing, key=lambda x: x["code"]):
                print(f"  {c['code']:<15} {c['credit_units']:<8}")
            all_missing.extend([(prog_name, c) for c in missing])
        else:
            print(f"\n  [OK] All CSV courses found in database")
        
        if extra:
            print(f"\n  [+] EXTRA IN DATABASE (not in CSV) ({len(extra)} courses):")
            print(f"  {'Code':<15} {'Credit':<8} {'Name'}")
            print(f"  {'-'*15} {'-'*8} {'-'*30}")
            for c in sorted(extra, key=lambda x: x["normalized_code"]):
                print(f"  {c['normalized_code']:<15} {c['credit_units']:<8} {c['name'][:40]}")
            all_extra.extend([(prog_name, c) for c in extra])
        else:
            print(f"\n  [OK] No extra courses in database")
        
        if mismatches:
            print(f"\n  [!] CREDIT UNIT MISMATCHES ({len(mismatches)} courses):")
            print(f"  {'Code':<15} {'CSV':<6} {'DB':<6}")
            print(f"  {'-'*15} {'-'*6} {'-'*6}")
            for m in sorted(mismatches, key=lambda x: x["code"]):
                print(f"  {m['code']:<15} {m['csv_credit']:<6} {m['db_credit']:<6}")
            all_mismatches.extend([(prog_name, m) for m in mismatches])
        else:
            print(f"\n  [OK] No credit unit mismatches")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nTotal Missing from DB: {len(all_missing)}")
    print(f"Total Extra in DB:      {len(all_extra)}")
    print(f"Total Credit Mismatches: {len(all_mismatches)}")
    
    # Note about the CSV format
    print("\n" + "=" * 80)
    print("NOTES")
    print("=" * 80)
    print("""
1. The CSV has INCONSISTENT formatting across programmes:
   - BAM sections use standard 3-row format (credits, prefixes, numbers)
   - Accountancy ND uses a MIXED format with combined codes
   - Some course codes in DB have trailing tabs/spaces

2. Duplicate course entries exist in the DB (e.g., 'ACC 111' vs 'ACC 111\\t')
   These appear to be legacy/test duplicates.

3. Shared courses (GNS, MTH, STA, ECO, etc.) appear in multiple programmes.
   A course listed under one programme's CSV section may belong to a
   different department in the database.

4. Some DB courses have NO code prefix matching any CSV programme,
   suggesting they are either unused or belong to other programmes.
""")

if __name__ == "__main__":
    main()
