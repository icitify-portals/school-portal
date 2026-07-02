import markdown
import os
import subprocess
import time

md_path = r"C:\Users\dell\.gemini\antigravity\brain\eb491633-a609-4653-8a6c-62904d486b53\legacy_payment_analysis.md"
html_path = r"C:\Users\dell\.gemini\antigravity\brain\eb491633-a609-4653-8a6c-62904d486b53\scratch\legacy_payment_analysis.html"
pdf_path = r"C:\Users\dell\.gemini\antigravity\brain\eb491633-a609-4653-8a6c-62904d486b53\legacy_payment_analysis.pdf"

with open(md_path, 'r', encoding='utf-8') as f:
    text = f.read()

html = markdown.markdown(text, extensions=['tables'])

full_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Legacy Payment Analysis</title>
<style>
    body {{ font-family: Arial, sans-serif; padding: 20px; }}
    table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    th {{ background-color: #f2f2f2; }}
    h1, h2, h3 {{ color: #333; }}
</style>
</head>
<body>
{html}
</body>
</html>
"""

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Generated HTML. Now running msedge...")
# Call Edge to print to PDF
edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]

edge_exe = None
for p in edge_paths:
    if os.path.exists(p):
        edge_exe = p
        break

if not edge_exe:
    print("Edge not found!")
    exit(1)

cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path.replace(chr(92), '/')}"
]

subprocess.run(cmd, check=True)
print("PDF generation complete!")
