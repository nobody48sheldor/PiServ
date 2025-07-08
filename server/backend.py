from flask import Flask, render_template, request, url_for, redirect, jsonify, send_file
from rapidfuzz import process
import os
from dotenv import load_dotenv
from pygments import highlight
from pygments.lexers import guess_lexer_for_filename, get_lexer_by_name
from pygments.formatters import HtmlFormatter
from pygments.util import ClassNotFound
from werkzeug.utils import secure_filename
import shutil
import netifaces


load_dotenv("./.flaskenv")
app = Flask(__name__)

directory="/home/arnaud/Desktop/"

def absPathOfBackendFile():
    filePath = ""
    absPathOfBacendFileList = os.path.abspath(__file__).split("/")[1:-1]
    print(absPathOfBacendFileList)
    for name in absPathOfBacendFileList:
        filePath = filePath + "/" + name
    return(filePath + "/")

filePath = absPathOfBackendFile()
print("THE PATH OF THE FILE IS : " + filePath)

chars_len = len(directory)+1
chars_max = len(directory)+1 + 30
print(filePath+"static/temp/")

ips = []
for iface in netifaces.interfaces():
    addrs = netifaces.ifaddresses(iface)
    if netifaces.AF_INET in addrs:
        for addr in addrs[netifaces.AF_INET]:
            ip = addr['addr']
            if ip.startswith("192.168."):  # skip loopback
                ips.append(ip)

HOST_IP = ips[0]
print("Local IPs:", HOST_IP)

Files=[]
Folders=[]
fileTypes = ["pdf","txt","png","jpg","jpeg","py","js","cpp","ml","htlm","css","scss","htmx","docx","odt","md","odg","tex","log","cmi","aux","c","cmo","svg","xlsx","sh","h","dat","gif","mp3","webp","mp4","mkv","MOV","webm","json"]
print(fileTypes)
def list_files_recursive(path):
    for entry in os.scandir(path):
        if entry.is_file():
            if str(entry).split(".")[-1][:-2] in fileTypes:
                Files.append(str(entry.path))
        elif entry.is_dir():
            Folders.append(str(entry.path))
            list_files_recursive(entry.path)

list_files_recursive(directory)
print("number of files : ",len(Files))
print("number of folders : ",len(Folders))

mode = "default"

@app.route("/")
def home():
    print("IP : ", request.headers.get('X-Forwarded-For', request.remote_addr), " MODE : ", mode)
    return( render_template("index.html") )


@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    # Fuzzy match using difflib
    #treat_results = lambda s: s[chars_len:] if (len(s) < (chars_max+3)) else "..."+s[-chars_max:]
    #matches = [treat_results(match[0]) for match in process.extract(query, Files, limit=5, score_cutoff=10)]
    matches = [match[0] for match in process.extract(query, Files, limit=5, score_cutoff=10)]
    return jsonify(matches)

@app.route("/ls")
def ls():
    query = request.args.get("q", "").strip()
    print("query = ", query)
    if not query:
        return jsonify([])

    parentDirectory, sep, after = query.rpartition("/")
    return jsonify([parentDirectory,".."] + os.listdir(parentDirectory) )

@app.route('/viewfile')
def view_pdf():
    query = request.args.get("q", "").strip()
    print("query = ", query)
    if not query:
        return( render_template("show_code.html", code=""))
    print( query.split('.') )
    if query.split('.')[-1] in ["pdf","png","jpg","jpeg","gif","mp4","mkv","mp3"]:
        return(send_file(query))
    else:
        with open(query,'r', encoding='utf-8') as file:
            code = file.read()
        try:
            lexer = guess_lexer_for_filename(query, code)
        except ClassNotFound:
            lexer = get_lexer_by_name('text')
        formatter = HtmlFormatter(linenos=True, cssclass="codehilite", style="default")
        highlighted_code = highlight(code, lexer, formatter)
        css_style = formatter.get_style_defs('.codehilite')
        #css_style = formatter.get_style_defs('.default')
        return render_template('show_code.html', code=highlighted_code, css_style=css_style)


@app.route('/checkfile', methods=['POST'])
def check_file():
    data = request.get_json()
    path = data.get('path')

    if not path:
        return jsonify({'error': 'Missing path'}), 400

    if os.path.isfile(path):
        return jsonify({'result': 1})
    else:
        return jsonify({'result': 0})


@app.route("/download")
def download():
    path = request.args.get("q")
    return send_file(path, as_attachment=True)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    path = request.form.get('path')
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename) # make the filename without weird characters
    file.save(os.path.join(path[:-1], filename))
    return jsonify({'success': True, 'filename': filename}), 200



@app.route("/search-upload")
def search_upload():
    query = request.args.get("q", "").strip()
    print(query)
    if not query:
        return jsonify([])

    # Fuzzy match using difflib
    #treat_results = lambda s: s[chars_len:] if (len(s) < (chars_max+3)) else "..."+s[-chars_max:]
    #matches = [treat_results(match[0]) for match in process.extract(query, Files, limit=5, score_cutoff=10)]
    matches = [match[0] for match in process.extract(query, Folders, limit=4, score_cutoff=10)]
    return jsonify(matches)


@app.route('/moveOrDeletFiles', methods=['POST'])
def moveOrDeletFile():
    data = request.get_json()
    if not data:
        return jsonify({'result': 0})
    else:
        if (data["deletFile"] == 1):
            print("here trying to delet file")
            os.remove(filePath+"static/temp"+"/"+data["upload_file"])
            return jsonify({'result': 1})
        if (data["deletFile"] == 0) and (data["upload_file"] != "") and (data["upload_path"] != ""):
            shutil.move(filePath+"static/temp"+"/"+data["upload_file"], data["upload_path"])

            list_files_recursive(directory)
            return jsonify({'result': 1})
        else:
            return jsonify({'result': 0})


@app.route('/get-abs-path', methods=['POST'])
def get_abs_path():
    data = request.get_json()
    rel_path = data.get('relpath')

    if not rel_path:
        return jsonify({"error": "Missing path"}), 400

    abs_path = filePath+rel_path
    return jsonify({"absolutepath": abs_path})



@app.route("/mode", methods=['POST'])
def toggle_mode():
    global mode
    mode_change = request.json.get('mode')
    if mode in ['default', 'powermode']:
        mode = mode_change
        return jsonify({'result': 1})
    else:
        return jsonify({"error": "bad mode"}), 400

@app.route("/powermode")
def powermode():
    return( render_template("powerIndex.html") )

@app.route("/ip_client", methods=['POST'])
def get_client_ip():
    return jsonify({"ip": request.headers.get('X-Forwarded-For', request.remote_addr)})

@app.route("/push", methods=['POST'])
def push():
    data = request.get_json()
    if not data:
        return jsonify({'result':0})
    paths = data.get('paths')
    print(paths)
    return jsonify({'result':1})

@app.route("/pull", methods=['POST'])
def pull():
    data = request.get_json()
    if not data:
        return jsonify({'result':0})
    paths = data.get('paths')
    print(paths)
    return jsonify({'result':1})

@app.route("/archivesearch")
def archivesearch():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    # Fuzzy match using difflib
    #treat_results = lambda s: s[chars_len:] if (len(s) < (chars_max+3)) else "..."+s[-chars_max:]
    #matches = [treat_results(match[0]) for match in process.extract(query, Files, limit=5, score_cutoff=10)]
    matches = [match[0] for match in process.extract(query, Folders, limit=8, score_cutoff=10)]
    return jsonify(matches)

@app.route("/archive", methods=['POST'])
def archive():
    data = request.get_json()
    if not data:
        return jsonify({'result':0})
    path = data.get('path')
    print(path)
    name = path.split("/")[-1]

    print("PYTHON : ", filePath+"static"+"/archive.sh "+name+" "+path)
    os.system(filePath+"static"+"/archive.sh "+name+" "+path)
    print(filePath+"static/toArchive"+"/"+name+".zip")
    print(1)
    return jsonify({'result':filePath+"static/toArchive"+"/"+name+".zip"})

@app.route("/download-complete", methods=['POST'])
def downloadComplete():
    data = request.get_json()
    filepath = data.get('filepath')
    print("TO REMOVE : ",filepath)
    try:
        os.remove(filepath)
        return jsonify({'result':1})
    except:
        return jsonify({'result':0})



if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000, debug=True)
