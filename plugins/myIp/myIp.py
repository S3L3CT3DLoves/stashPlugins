import sys
import urllib.request

try:
    import stashapi.log as log
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install stashapp-tools", file=sys.stderr)
    sys.exit()


external_ip = urllib.request.urlopen('https://v4.ident.me/').read().decode('utf8')
log.info(f"Current IP : {external_ip}")
