import sys

try:
    content = open('src/app/admin/result-module/print/page.tsx', 'r', encoding='utf-8').read()

    # Enhance headers
    # FSS template
    content = content.replace('fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>FEDERAL SCHOOL OF STATISTICS', 'fontSize: 18, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>FEDERAL SCHOOL OF STATISTICS')
    content = content.replace('fontSize: 10, marginBottom: 4 }}>(National Bureau of Statistics)', 'fontSize: 12, marginBottom: 8 }}>(National Bureau of Statistics)')
    content = content.replace('fontSize: 9, lineHeight: 1.4', 'fontSize: 11, lineHeight: 1.5')
    content = content.replace('width: 60, height: 60', 'width: 80, height: 80')
    content = content.replace('fontSize: 12, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 0.5 }}>EXAMINATION TRANSCRIPT', 'fontSize: 14, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 0.5 }}>EXAMINATION TRANSCRIPT')
    content = content.replace('fontSize: 11, textTransform: "uppercase", textDecoration: "underline", marginTop: 4 }}>{programmeName}', 'fontSize: 13, textTransform: "uppercase", textDecoration: "underline", marginTop: 6 }}>{programmeName}')
    
    # Grading Key page break removal
    content = content.replace('pageBreakBefore: "always",', '')
    
    open('src/app/admin/result-module/print/page.tsx', 'w', encoding='utf-8').write(content)
    print("SUCCESS")
except Exception as e:
    print(e)
