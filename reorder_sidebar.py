import os
import re

target_order = [
    "dashboard.html",
    "budget.html",
    "expenses.html",
    "goals.html",
    "loans.html",
    "portfolio.html",
    "report.html",
    "score.html",
    "recommendation.html"
]

def reorder_nav(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {filepath} due to read error: {e}")
        return
        
    # find <nav class="sidebar-nav"> ... </nav>
    # Note: re.DOTALL ensures . matches newlines
    nav_match = re.search(r'(<nav class="sidebar-nav">)(.*?)(</nav>)', content, flags=re.DOTALL | re.IGNORECASE)
    if not nav_match: 
        return
    
    nav_inner = nav_match.group(2)
    
    # Extract all <a> tags (assuming no nested <a> tags)
    raw_links_matches = list(re.finditer(r'<a\s+href="([^"]+)".*?</a>', nav_inner, flags=re.DOTALL | re.IGNORECASE))
    
    if not raw_links_matches:
        return
        
    raw_links = {m.group(1): m.group(0) for m in raw_links_matches}

    # Reconstruct in target order
    ordered_links = []
    for href in target_order:
        if href in raw_links:
            ordered_links.append(raw_links[href])
            
    # Add any links that weren't in the target order at the bottom
    for href, link_html in raw_links.items():
        if href not in target_order:
            ordered_links.append(link_html)

    # Rebuild inner nav
    new_inner = "\n                " + "\n                ".join(ordered_links) + "\n            "
    
    # Replace in original content
    new_content = content[:nav_match.start()] + nav_match.group(1) + new_inner + nav_match.group(3) + content[nav_match.end():]
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

# Make sure we're in the right directory
repo_path = r"e:\Fintrack"
for file in os.listdir(repo_path):
    if file.endswith(".html"):
        reorder_nav(os.path.join(repo_path, file))
        
print("Reordering complete.")
