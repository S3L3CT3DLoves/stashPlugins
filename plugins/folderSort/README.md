# *folderSort*
Organise your PMV folder using data from Stash

Designed to keep all your PMVs in folders named based on the PMV **Creator** (Stash Studio)

# Usage
The plugin is executed by pressing the button in the Task menu.

Once the plugin is done, Run a "Scan" in Stash to detect the changes.

# Configuration
For now configuration is done directly in the code, I'll add it in a separate file in the future
- *NO_SPACES* Removes space character from folder names
- *SKIP_MULTI_FILES* Required for now, until I decide if I will actually develop this feature
- *USE_SUBFOLDERS* If TRUE, the script will take into account Studio parent hierachy, and reproduce it in the folders
- *REMOVE_EMPTY* Remove empty folders after moving all files
- *LOG_FILE* Name of the log file, important for Dry Runs
- *LOG_LEVEL* To limit the amount of logs created, change it at your own risk