import json
import os
import re
import shutil
import sys
from pathlib import Path
import logging
import traceback

try:
    import stashapi.log as log
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install stashapp-tools", file=sys.stderr)
    sys.exit()

# Global variables
stash = None
BASE_PATH = ""
logger = None

# CONFIG - Will implement clean after v24
NO_SPACES = False
SKIP_MULTI_FILES = True
USE_SUBFOLDERS = True
REMOVE_EMPTY = True
LOG_FILE = "log.txt"
LOG_LEVEL = logging.INFO

class SceneData:
    id = 0
    current_path = Path("")
    title = ""
    studio = ""
    destination_path = Path("")

    def __repr__(self):
        return "SceneData(id:{0}, current_path:{1}, title:{2}, studio: {3}, destination_path: {4})".format(self.id, self.current_path.resolve(), self.title, json.dumps(self.studio), self.destination_path.resolve())

def get_studio_data(studio_id):
    parent = None
    studio_data = stash.find_studio(studio_id)
    if studio_data['parent_studio'] is not None:
        parent = get_studio_data(studio_data['parent_studio']['id'])
    output = {
        'name' : studio_data['name'],
        'parent' : parent
    }
    return output

def parse_scene_data(scene):
    # scene data template
    scene_data = SceneData()

    if scene['studio'] is not None:
        scene_data.studio = get_studio_data(scene['studio'])
    
    if scene['title'] is not None:
        scene_data.title = scene['title']

    if len(scene['files']) > 1 and SKIP_MULTI_FILES:
        raise Exception(f"Multiple files for scene {scene['id']}")

    scene_data.id = scene['id']
    scene_data.current_path = Path(scene['files'][0]['path'])
    
    return scene_data

def cleanup_text(path: Path):
    text = str(path.resolve())
    text = re.sub(r'\(\W*\)|\[\W*\]|{[^a-zA-Z0-9]*}', '', text)
    text = re.sub(r'[{}]', '', text)
    text = text.strip(" -_.")
    return Path(text)

def maybe_remove_space(s):
    return s if not NO_SPACES else s.replace(' ', '')

def gen_folder_substudio(studio):
    prev_folders = ""
    if studio['parent'] is not None and USE_SUBFOLDERS:
        prev_folders = gen_folder_substudio(studio['parent'])

    if studio is not None and studio != "" and studio['name'] != "":
        return prev_folders / Path(maybe_remove_space(studio['name']))

def generate_new_path(scene):
    if scene.id == 0:
        log.info(f"Not moving {scene.title} due to lack of information")
        return
    if not verify_base_path(scene.current_path):
        log.info(f"Not moving {scene.title} - It is not in the current Library scope")
    
    # No file renaming yet

    # Move scenes with no studio to the base path
    if scene.studio == "" or scene.studio is None:
        target_path = BASE_PATH / scene.current_path.name
        return BASE_PATH / scene.current_path.name
    
    FOLDER = gen_folder_substudio(scene.studio)

    return cleanup_text(BASE_PATH / FOLDER) / scene.current_path.name

def verify_base_path(path: Path):
    # Just in case, if Stash is configured with multiple Libraries, only process files with out BASE_PATH
    return BASE_PATH in path.parents

def get_file_logger(file: Path):
    log_handler = logging.FileHandler(file)
    log_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s]  %(message)s"))
    log_handler.encoding = "utf-8"
    logger = logging.getLogger("file")
    logger.setLevel(LOG_LEVEL)
    logger.addHandler(log_handler)
    return logger

def remove_empty_folders():
    if not REMOVE_EMPTY:
        return
    sub_dirs = reversed(list(BASE_PATH.rglob("**/")))
    try:
        for sub_dir in sub_dirs:
            if len(list(sub_dir.glob("*"))) == 0:
                logger.info(f"Removing empty folder: {sub_dir}")
                log.info(f"Removing empty folder: {sub_dir}")
                sub_dir.rmdir()
    except Exception:
        logger.error(traceback.format_exc())

def main():
    # Reminder for logs: log -> Stash log, logger -> File

    FRAGMENT = json.loads(sys.stdin.read())
    SERVER_INFO = FRAGMENT["server_connection"]
    PLUGIN_DIR = SERVER_INFO["PluginDir"]
    MODE = FRAGMENT['args'].get("mode")
    log.debug("{}".format(FRAGMENT))
    log.info("--- Starting Plugin 'folderSort' ---")

    global logger
    logger = get_file_logger(Path(PLUGIN_DIR) / LOG_FILE)
    logger.info("--- Executing Plugin ---")

    global stash
    stash = StashInterface({
        "scheme": SERVER_INFO['Scheme'],
        "host":SERVER_INFO['Host'],
        "port": SERVER_INFO['Port'],
        "logger": log
    })
    # Currently only works for Stash configured with ONE Library
    global BASE_PATH
    BASE_PATH = Path(stash.get_configuration()['general']['stashes'][0]['path'])
    logger.debug(f"Using BASE_PATH='{BASE_PATH}'")

    if MODE == "test":
        log.warning("No test configured for now")
        return

    all_scenes = stash.find_scenes()
    log.info("Processing {} scenes".format(len(all_scenes)))
    logger.info("Processing {} scenes".format(len(all_scenes)))

    if MODE == "dryrun":
        log.info("-- DRY RUN --")
        logger.info("-- DRY RUN --")

    changed = 0
    for scene in all_scenes:
        try:
            data = parse_scene_data(scene)
        except Exception as err:
            log.warning(err)
            logger.warning(err)
            continue
        data.destination_path = generate_new_path(data)
        if data.destination_path != data.current_path:
            changed+=1
            log.info(f"Moving '{data.current_path}' to '{data.destination_path}'")
            logger.info(f"SceneChange(current:'{data.current_path}', destination:'{data.destination_path}', id:'{data.id}', title:'{data.title}')")
            if MODE == "execute":
                # Actually move the file
                try:
                    data.destination_path.parent.mkdir(parents=True, exist_ok=True)
                    data.current_path.rename(data.destination_path)
                except Exception as err:
                    log.warning(f"Something went wrong during the rename {err}")
                    logger.warning(f"Something went wrong during the rename {err}")
    
    log.info(f"{changed} files moved")
    logger.info(f"{changed} files moved")

    if MODE == "execute":
        remove_empty_folders()

    log.info("Plugin execution ended normally")
    logger.info("Plugin execution ended normally")
    sys.exit()

if __name__ == '__main__':
  main()
