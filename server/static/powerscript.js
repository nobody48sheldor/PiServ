const folderInput = document.getElementById("folder-search");
const folderResults = document.getElementById("folder-results");
const folderSelectedList = document.getElementById("folder-selectedList");
const pushBtn = document.getElementById("pushBtn");
const pullBtn = document.getElementById("pullBtn");
const archiveInput = document.getElementById("archive-search");
const archiveResults = document.getElementById("archive-results");
const archiveBtn= document.getElementById("archiveBtn");

const toArchivePathFolder = "/home/arnaud/Desktop/arnaud/code/web/PiServ/server/static/toArchive";

async function getIp() {
	const response = await fetch('/ip_client', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	const data = await response.json();
	return data.ip;
}

async function push(paths) {
	const response = await fetch('/push', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ paths: paths })
	});
	const data = await response.json();
	console.log(data.result);
	return data.result;
}

async function pull(paths) {
	const response = await fetch('/pull', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ paths: paths })
	});
	const data = await response.json();
	console.log(data.result);
	return data.result;
}

async function archive(path) {
	const response = await fetch('/archive', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ path: path })
	});
	const data = await response.json();
	console.log(data.result);
	return data.result;
}





// Handle input events
folderInput.addEventListener("input", async () => {
	const query = folderInput.value;
	const ip_client = await getIp();
	console.log("IP_CLIENT : ", ip_client)
	fetch("http://"+ip_client+":5001/foldersearch?q="+encodeURIComponent(query))
		.then(res => res.json())
		.then(handleSearchResults);
});


pushBtn.addEventListener("click", async () => {
	const paths = folderSelectedList.querySelectorAll("div > p.hidden");
	folderSelectedList.innerHTML = "";
	const pathsList = Array.from(paths).map(p => p.textContent);
	const result = await push(pathsList);
	alert("push : "+pathsList+" \n has been : "+result);
});

pullBtn.addEventListener("click", async () => {
	const paths = folderSelectedList.querySelectorAll("div > p.hidden");
	folderSelectedList.innerHTML = "";
	const pathsList = Array.from(paths).map(p => p.textContent);
	const result = await pull(pathsList);
	alert("pull : "+pathsList+" \n has been : "+result);
});


archiveInput.addEventListener("input", async () => {
	const query = archiveInput.value;
	console.log(query);
	fetch("/archivesearch?q="+encodeURIComponent(query))
		.then(res => res.json())
		.then(handleSearchResultsArchive);
});

archiveBtn.addEventListener("click", async () => {
	const FolderToArchive = archiveResults.querySelectorAll("div.toArchive > p.hidden");
	const path = FolderToArchive[0].textContent;
	const result = await archive(path);
	console.log("RESULT : ", result);
	alert("archive : "+path+" \n has been : "+result);

	if (result !== 0) {
		// Step 2: Fetch the archive file as a Blob
		const response = await fetch(`/download?q=${encodeURIComponent(result)}`);
		if (!response.ok) {
			alert("Download failed.");
			return;
		}

		const blob = await response.blob();

		// Step 3: Trigger file download using the blob
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = result.split("/").pop(); // Set actual filename
		link.click();
		URL.revokeObjectURL(url);

		// Step 4: (Optional) Notify backend download is complete
		await fetch("/download-complete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filepath: result })
		});
	}





	archiveResults.innerHTML = "";
});






function createDivElement(text, fulltext, textSize=30) {
	const divWrap = document.createElement("div");
	const icon = document.createElement("i");
	icon.classList.add("icon");
	divWrap.className = "divWrap";
	const p = document.createElement("p");
	const pfull = document.createElement("p");
	const parts = text.split(".");
	const last_chars = parts[parts.length - 1];
	if (text.length < textSize) {
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
		const text_cut = text.slice(0, textSize/3)+"..."+text.slice(text.length-(2*textSize/3), text.length);
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
	pfull.textContent = fulltext;
	pfull.classList.add("hidden");

	divWrap.appendChild(icon);
	divWrap.appendChild(p);
	divWrap.appendChild(pfull);
	return divWrap;
}


function addSelectedElement(text) {
	console.log(text);
	const divWrap = createDivElement(text, text);
	folderSelectedList.appendChild(divWrap);
	divWrap.addEventListener("click", () => {
		folderSelectedList.removeChild(divWrap);
	})
}


function handleSearchResults(data) {
	folderResults.innerHTML = "";
	data.forEach(item => {
		const displayText = item.slice(item.length - 32 - Math.min(25, item.length - 32));
		const divWrap = createDivElement(displayText);
		folderResults.appendChild(divWrap);

		divWrap.addEventListener("click", () => {
			addSelectedElement(item);
			folderResults.removeChild(divWrap);
		});
	});
}

function handleSearchResultsArchive(data) {
	archiveResults.innerHTML = "";
	data.forEach(item => {
		const displayText = item.slice(item.length - 32 - Math.min(25, item.length - 32));
		const divWrap = createDivElement(displayText,item,48);
		archiveResults.appendChild(divWrap);

		divWrap.addEventListener("click", () => {
			const archiveSelected = archiveResults.querySelectorAll("div");
			archiveSelected.forEach(item => {
				item.classList.remove("toArchive");
			});
			divWrap.classList.add("toArchive");
		});
	});
}
