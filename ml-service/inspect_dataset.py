import kagglehub
import os

path = kagglehub.dataset_download("mahmudulhaqueshawon/blood-dataset")
print("Path to dataset files:", path)

for root, dirs, files in os.walk(path):
    level = root.replace(path, '').count(os.sep)
    indent = ' ' * 4 * (level)
    print('{}{}/'.format(indent, os.path.basename(root)))
    subindent = ' ' * 4 * (level + 1)
    if not dirs:
        count = len(files)
        print('{}{} files'.format(subindent, count))
