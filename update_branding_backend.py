
import base64
import re
import os

IMAGE_PATH = "public/thank_donors_stamp.png"
TS_FILE_PATH = "supabase/functions/webhook-receiver/index.ts"

def main():
    # 1. Read and encode image
    try:
        with open(IMAGE_PATH, "rb") as f:
            img_data = f.read()
            b64_str = base64.b64encode(img_data).decode("utf-8")
        print(f"Encoded image size: {len(b64_str)} chars")
    except FileNotFoundError:
        print(f"Error: Could not find image at {IMAGE_PATH}")
        return

    # 2. Read index.ts
    try:
        with open(TS_FILE_PATH, "r") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find index.ts at {TS_FILE_PATH}")
        return

    # 3. Update CSS
    new_css = """.branding-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 50;
      opacity: 0.9;
      width: 64px;
    }"""
    
    # Regex to replace the css block
    content = re.sub(r'\.branding-badge\s*\{[^}]+\}', new_css, content)

    # 4. Update HTML Structure
    new_html = f"""<div class="branding-badge">
      <img src="data:image/png;base64,{b64_str}" alt="Thank Donors" style="width: 100%; height: auto;" />
    </div>"""
    
    # Regex to replace the html block. match non-greedy until </div>
    # Note: The original code has some indentation, so the regex handles that loosely
    content = re.sub(r'<div class="branding-badge">[\s\S]*?</div>', new_html, content)
    
    # Write back
    with open(TS_FILE_PATH, "w") as f:
        f.write(content)
        
    print("Updated index.ts successfully.")

if __name__ == "__main__":
    main()
