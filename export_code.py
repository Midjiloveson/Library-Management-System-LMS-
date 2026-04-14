import os

# Files or directories to ignore (to keep the text file clean)
IGNORE_LIST = {
    'node_modules', '.git', 'dist', 'package-lock.json', 
    'export_code.py', '.DS_Store', 'refresh.txt', 'public', 'client'
}

# File extensions to include
INCLUDE_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.txt'}

def export_project_to_txt(output_filename="project_backup.txt"):
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk('.'):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_LIST]
            
            for file in files:
                if any(file.endswith(ext) for ext in INCLUDE_EXTENSIONS) and file not in IGNORE_LIST:
                    file_path = os.path.join(root, file)
                    outfile.write(f"\n{'='*50}\n")
                    outfile.write(f"FILE: {file_path}\n")
                    outfile.write(f"{'='*50}\n\n")
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"Error reading file: {e}\n")
                    outfile.write("\n")

if __name__ == "__main__":
    export_project_to_txt()
    print("Project successfully exported to project_backup.txt")