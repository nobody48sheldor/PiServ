from flask import Flask, render_template, request, url_for, redirect, jsonify, send_file
from rapidfuzz import process
import os
from dotenv import load_dotenv
from pygments import highlight
from pygments.lexers import guess_lexer_for_filename, get_lexer_by_name
from pygments.formatters import HtmlFormatter
from pygments.util import ClassNotFound


load_dotenv("./.flaskenv")
app = Flask(__name__)

directory="/home/arnaud/Desktop/"
chars_len = len(directory)+1
chars_max = len(directory)+1 + 30


Files=[]
Folders=[]
fileTypes = {"pdf":"","txt":"","png":"","jpg":"","jpeg":"","py":"","js":"","cpp":"","ml":"","htlm":"","css":"","scss":"","htmx":"","docx":"","odt":"","md":"","odg":"","tex":"","log":"","cmi":"","aux":"","c":"","cmo":"","svg":"","xlsx":"","sh":"","h":"","dat":"","gif":"","mp3":"","webp":"","mp4":"","mkv":"","MOV":"","webm":"","json":""}
print(fileTypes)
def list_files_recursive(path):
    for entry in os.scandir(path):
        if entry.is_file():
            if str(entry).split(".")[-1][:-2] in fileTypes.keys():
                Files.append(str(entry.path))
        elif entry.is_dir():
            Folders.append(str(entry.path))
            list_files_recursive(entry.path)

list_files_recursive(directory)
print(len(Files))
print(len(Folders))

@app.route("/")
def home():
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
        formatter = HtmlFormatter(linenos=True, cssclass="codehilite", style="monokai")
        highlighted_code = highlight(code, lexer, formatter)
        css_style = formatter.get_style_defs('.codehilite')
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


if __name__ == "__main__":
	app.run(debug=True)
