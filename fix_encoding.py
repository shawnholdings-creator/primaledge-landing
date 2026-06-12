"""Fix remaining mojibake - pass 3."""
import os

def fix_remaining(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    replacements = {
        '\u00e2\u2020\u2019': '\u2192',  # → (right arrow)
        '\u00e2\u2020\u0090': '\u2190',  # ← (left arrow)
    }
    
    count = 0
    for bad, good in replacements.items():
        if bad in text:
            n = text.count(bad)
            text = text.replace(bad, good)
            count += n
    
    if count > 0:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        print(f'FIXED: {os.path.basename(path)} ({count} more)')
    else:
        print(f'CLEAN: {os.path.basename(path)}')

base = os.path.join(
    r'c:\Users\shawn\OneDrive\antigravity\primaledge-landing',
    r'elastic-scanner-landing\client\src\pages'
)
for fn in ['AIDashboard.tsx', 'WeeklyIncome.tsx']:
    fix_remaining(os.path.join(base, fn))
