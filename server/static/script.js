const input = document.getElementById("search");
const results = document.getElementById("results");
const ls = document.getElementById("ls");
const ls2 = document.getElementById("ls2");
const ls2title = document.getElementById("ls2title");
const viewer = document.getElementById("viewer");
const downloadBtn = document.getElementById("downloadBtn");
const dropZone = document.getElementById("dropZone");
const iconDrop = document.getElementById("iconDrop");
const fileInput = document.getElementById('fileInput');
const inputUpload = document.getElementById("search-upload");
const resultsUpload = document.getElementById("results-upload");
const uploadBtn = document.getElementById("uploadBtn");
const cancelBtn = document.getElementById("cancelBtn");

let currentViewedPath = null;
let upload_file = null;
let upload_path = null;
let path_temp = null;
let path_static = null;
let bongoCat = null;


// Helper to check if path is a file
async function isFile(path) {
	const response = await fetch('/checkfile', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ path })
	});
	const data = await response.json();
	return data.result === 1;
}

function getParentPath(fullPath) {
	// Remove trailing slash if any
	const cleaned = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;

	// Split into parts and remove the last part
	const parts = cleaned.split('/');
	parts.pop();

	// Special case: root (empty parts gives [''], so we return "/")
	return parts.length === 0 || (parts.length === 1 && parts[0] === "") ? "/" : parts.join('/');
}

async function getAbsolutePathFromBackend(relativePath) {
	  try {
		      const response = await fetch("/get-abs-path", {
			            method: "POST",
			            headers: {
					            "Content-Type": "application/json"
					          },
			            body: JSON.stringify({ relpath: relativePath })
			          });

		      if (!response.ok) {
			            throw new Error("Failed to fetch absolute path");
			          }

		      const data = await response.json();
		      return data.absolutepath;
		    } catch (error) {
			        console.error("Error getting absolute path:", error);
			        return null;
			      }
}


getAbsolutePathFromBackend("static/temp/")
	.then(absPath => {
	if (absPath) {
		console.log("Absolute path from server:", absPath);
		path_temp= absPath+"/";
	} else {
		console.log("No path returned");
	}
});

getAbsolutePathFromBackend("static/")
	.then(absPath => {
	if (absPath) {
		console.log("Absolute path from server:", absPath);
		path_static= absPath+"/";
		bongoCat = path_static+"Bongo-Cat-PNG-HD.gif"
	} else {
		console.log("No path returned");
	}
});




// Load and display files in a directory
function displayDirectoryContents(container, path, targetContainer = null) {
	fetch(`/ls?q=${encodeURIComponent(path)}`)
		.then(res => res.json())
		.then(data => {
			container.innerHTML = "";
			const basePath = data[0];
			const entries = container === ls2 ? data.slice(2) : data.slice(1);
			entries.forEach(name => {
				const fullPath = `${basePath}/${name}`;
				const divWrap = createDivElement(name);
				container.appendChild(divWrap);

				divWrap.addEventListener("click", async () => {
					viewer.src = `/viewfile?q=${encodeURIComponent(bongoCat)}`;
					if (await isFile(fullPath)) {
						viewer.src = `/viewfile?q=${encodeURIComponent(fullPath)}`;
						currentViewedPath = fullPath;
					} else {
						if (name === "..") {
							if (basePath === "/") {
								displayDirectoryContents(ls, basePath+"/", ls2);
								ls2.innerHTML="";
								return;
							} else {
							displayDirectoryContents(ls, getParentPath(basePath)+"/", ls2);
							displayDirectoryContents(ls2, basePath+"/");
							return;
							}
						}
						if (targetContainer) {
							displayDirectoryContents(targetContainer, `${fullPath}/`);
						} else {
							displayDirectoryContents(ls, fullPath, ls2);
							displayDirectoryContents(ls2, fullPath+"/");
						}
					}
				});
			});
			if (container === ls2) {
				ls2title.innerHTML = "";
				ls2title.classList.remove("hidden");
				ls2title.classList.add("ls2title");
				const titleDir = document.createElement("p");
				titleDir.className = "titleDir";
				titleDir.textContent = data[0].split("/")[data[0].split("/").length - 1];
				ls2title.appendChild(titleDir)
			}

		});
}

// Create a styled div element with text
function createDivElement(text) {
	const divWrap = document.createElement("div");
	const icon = document.createElement("i");
	icon.classList.add("icon");
	divWrap.className = "divWrap";
	const p = document.createElement("p");
	const parts = text.split(".");
	const last_chars = parts[parts.length - 1];
	if (text.length < 30) {
		if (last_chars !== text) {
			p.textContent = text;
			icon.className = "fa-regular";
			icon.classList.add("fa-file");
		if (text === "..") {
			icon.classList.remove("fa-file");
		}
		} else {
			p.textContent = text;
			icon.className = "fa-solid";
			icon.classList.add("fa-folder");
		}
	} else {
		const text_cut = text.slice(0, 10)+"..."+text.slice(text.length-20, text.length);
		if (last_chars !== text) {
			p.textContent = text_cut;
			icon.className = "fa-regular";
			icon.classList.add("fa-file");
		} else {
			p.textContent = text_cut;
			icon.className = "fa-solid";
			icon.classList.add("fa-folder");
		}
	}
	divWrap.appendChild(icon);
	divWrap.appendChild(p);
	return divWrap;
}

// Populate search results and bind click behavior
function handleSearchResults(data) {
	results.innerHTML = "";
	data.forEach(item => {
		const displayText = item.slice(item.length - 32 - Math.min(25, item.length - 32));
		const divWrap = createDivElement(displayText);
		results.appendChild(divWrap);

		divWrap.addEventListener("click", () => {
			viewer.src = `/viewfile?q=${encodeURIComponent(bongoCat)}`;
			viewer.src = `/viewfile?q=${encodeURIComponent(item)}`;
			currentViewedPath = item;
			displayDirectoryContents(ls, item, ls2);
			ls2.innerHTML="";
			ls2title.innerHTML="";
			ls2title.classList.add("hidden");
			ls2title.classList.remove("ls2title");
		});
	});
}

function handleSearchResults_upload(data) {
	resultsUpload.innerHTML = "";
	data.forEach(item => {
		const displayText = item.slice(item.length - 32 - Math.min(25, item.length - 32));
		const divWrap = createDivElement(displayText);
		resultsUpload.appendChild(divWrap);
		divWrap.addEventListener("click", () => {
			upload_path = item+"/";
			for (const child of resultsUpload.children) {
				child.classList.remove('green');
			}
			divWrap.classList.add("green");
		});
	});
}


function uploadFile(file) {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("path", path_temp);

	upload_file = file.name;
	viewer.src = `/viewfile?q=${encodeURIComponent(bongoCat)}`;

	fetch('/upload', {
		method: 'POST',
		body: formData
	})
		.then(res => res.json())
		.then(data => {
			if (data.success) {
				viewer.src = `/viewfile?q=${encodeURIComponent(path_temp+data.filename)}`;
				currentViewedPath = null;
				upload_file = data.filename;
				// currentViewedPath = path_temp+file.name;
			} else {
				alert("Error: " + data.error);
			}
		})
		.catch(err => alert("Upload failed: " + err));
}


// Handle input events
input.addEventListener("input", () => {
	const query = input.value;
	if (query === "") {
		ls.innerHTML = "";
		ls2.innerHTML = "";
		ls2title.innerHTML = "";
		ls2title.classList.add("hidden");
		ls2title.classList.remove("ls2title");
		results.innerHTML = "";
	} else {
	fetch(`/search?q=${encodeURIComponent(query)}`)
		.then(res => res.json())
		.then(handleSearchResults);
	}
});

inputUpload.addEventListener("input", () => {
	const query = inputUpload.value;
	fetch(`/search-upload?q=${encodeURIComponent(query)}`)
		.then(res => res.json())
		.then(handleSearchResults_upload);
});



downloadBtn.addEventListener("click", () => {
	if (currentViewedPath) {
		const link = document.createElement("a");
		link.href = `/download?q=${encodeURIComponent(currentViewedPath)}`;
		link.download = ""; // This hints to the browser to download
		link.click();
	}
});





dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
	e.preventDefault();
	iconDrop.classList.add("fa-file-import");
	iconDrop.classList.remove("fa-cloud-arrow-up");
});

dropZone.addEventListener("dragleave", (e) => {
	e.preventDefault();
	iconDrop.classList.remove("fa-file-import");
	iconDrop.classList.add("fa-cloud-arrow-up");
});

dropZone.addEventListener('drop', (e) => {
	e.preventDefault();
	iconDrop.classList.remove("fa-file-import");
	iconDrop.classList.add("fa-cloud-arrow-up");
	const file = e.dataTransfer.files[0];
	if (file) uploadFile(file);
});

fileInput.addEventListener('change', () => {
	const file = fileInput.files[0];
	if (file) uploadFile(file);
});

cancelBtn.addEventListener('click', async () => {
	for (const child of resultsUpload.children) {
		child.classList.remove('green');
	}
	if (currentViewedPath === null) {
		viewer.src = "";
	}
	const deletFile = 1;
	if ( upload_file !== null ) {
		const response = await fetch('/moveOrDeletFiles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ upload_path, upload_file, deletFile })
		});
		const resultResponse = await response.json();
		if ( resultResponse.result === 1) {
			alert("upload cancelled");
		} else { 
			alert("Error : " + response.error);
		}
	}
	upload_path = null;
	upload_file = null;

});

uploadBtn.addEventListener('click', async () => {
	for (const child of resultsUpload.children) {
		child.classList.remove('green');
	}
	if (currentViewedPath === null) {
		viewer.src = "";
	}
	const deletFile = false;
	if ( (upload_path !== null) && (upload_file !== null)) {
		const response = await fetch('/moveOrDeletFiles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ upload_path, upload_file, deletFile })
		});
		const resultResponse = await response.json();
		if ( resultResponse.result === 1) {
			console.log( resultResponse.result );
			alert("Success uploading : " + upload_file + " to " + upload_path);
		} else { 
			alert("Error : " + response.error);
		}
	} else {
		alert("Error : missing an upload path or file");
	}
	upload_path = null;
	upload_file = null;

});




