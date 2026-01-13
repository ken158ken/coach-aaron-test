import json
import os

def parse_social_links(file_path):
    data = []
    current_item = None

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            if line.startswith('http') or line.startswith('www'):
                # It's a link
                if current_item:
                    current_item['links'].append(line)
                else:
                    # Orphaned link, shouldn't happen based on file structure but handling it
                    current_item = {'description': 'Unknown', 'links': [line]}
                    data.append(current_item)
            else:
                # It's a description/title
                current_item = {'description': line, 'links': []}
                data.append(current_item)

    return data

if __name__ == "__main__":
    input_file = "社群帳號連結.txt"
    output_file = "social_data.json"
    
    result = parse_social_links(input_file)
    
    if result:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Successfully converted '{input_file}' to '{output_file}'")
    else:
        print("No data extracted.")
