import re
import os

def find_rogue_braces(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        # Find } that are NOT preceded by { on the same line (roughly)
        # and NOT at the end of a block or closing an interpolation.
        
        # This is hard to do with regex perfectly, so let's just dump every } and its context.
        for m in re.finditer(r'\}', line):
            print(f"Line {i+1}, Pos {m.start()}: context: ...{line[max(0, m.start()-10):min(len(line), m.end()+10)]}...")

if __name__ == "__main__":
    find_rogue_braces('src/app/staff/dashboard/page.tsx')
