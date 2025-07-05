const folderInput = document.getElementById("folder-search");
const folderResults = document.getElementById("folder-results");
const folderSelectedList = document.getElementById("folder-selectedList");



async function getIp() {
	const response = await fetch('/ip_client', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	const data = await response.json();
	return data.ip;
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


function addSelectedElement(text) {
	console.log(text);
	const divWrap = createDivElement(text);
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
			addSelectedElement(displayText);
			folderResults.removeChild(divWrap);
		});
	});
}



