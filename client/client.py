from flask import Flask, render_template, request, url_for, redirect, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import netifaces
from rapidfuzz import process


load_dotenv("./.flaskenv")
app = Flask(__name__)
CORS(app)


ips = []
for iface in netifaces.interfaces():
    addrs = netifaces.ifaddresses(iface)
    if netifaces.AF_INET in addrs:
        for addr in addrs[netifaces.AF_INET]:
            ip = addr['addr']
            if ip.startswith("192.168."):  # skip loopback
                ips.append(ip)

HOST_IP = ips[0]

Files=[]
Folders=[]
fileTypes = ["pdf","txt","png","jpg","jpeg","py","js","cpp","ml","htlm","css","scss","htmx","docx","odt","md","odg","tex","log","cmi","aux","c","cmo","svg","xlsx","sh","h","dat","gif","mp3","webp","mp4","mkv","MOV","webm","json"]
directory="/home/arnaud/Desktop/"

def list_files_recursive(path):
    for entry in os.scandir(path):
        if entry.is_file():
            if str(entry).split(".")[-1][:-2] in fileTypes:
                Files.append(str(entry.path))
        elif entry.is_dir():
            Folders.append(str(entry.path))
            list_files_recursive(entry.path)

list_files_recursive(directory)


@app.route("/")
def home():
    print("IP : ", request.headers.get('X-Forwarded-For', request.remote_addr))
    return( render_template("base.html") )

@app.route("/foldersearch")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    # Fuzzy match using difflib
    #treat_results = lambda s: s[chars_len:] if (len(s) < (chars_max+3)) else "..."+s[-chars_max:]
    #matches = [treat_results(match[0]) for match in process.extract(query, Files, limit=5, score_cutoff=10)]
    matches = [match[0] for match in process.extract(query, Folders, limit=5, score_cutoff=10)]
    return jsonify(matches)


if __name__ == "__main__":
	app.run(host='0.0.0.0', port=5001, debug=True)
