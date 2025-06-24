const input = document.getElementById("search");
const results = document.getElementById("results");
const ls = document.getElementById("ls");
const ls2 = document.getElementById("ls2");
const viewer = document.getElementById("viewer");
const downloadBtn = document.getElementById("downloadBtn");
const toggleDarkLight = document.getElementById("toggleDarkLight");
const iconTheme = document.getElementById("iconTheme");

const colors = {
  dark: {
    '--primary-color-abs': 'white',
    '--primary-color': '#3D3D59',
    '--secondary-color': '#4945FF',
    '--thirdary-color': '#303048',
    '--text-color': '#C0C0CF',
    '--background-primary-color': '#181826',
    '--background-secondary-color': '#212134',
  },
  light: {
    '--primary-color-abs': 'black',
    '--primary-color': '#d1b48e',
    '--secondary-color': '#fc8712',
    '--thirdary-color': '#c7b69f',
    '--text-color': '#171513',
    '--background-primary-color': '#e0cebc',
    '--background-secondary-color': '#e0cbaf',
  }
};

let theme = "dark";
let currentViewedPath = null;


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
					if (await isFile(fullPath)) {
						viewer.src = `/viewfile?q=${encodeURIComponent(fullPath)}`;
						currentViewedPath = fullPath;
					} else {
						console.log(name);
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
	console.log("last chars : ", last_chars, " of ", text)
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
			viewer.src = `/viewfile?q=${encodeURIComponent(item)}`;
			currentViewedPath = item;
			displayDirectoryContents(ls, item, ls2);
			ls2.innerHTML="";
		});
	});
}

// Handle input events
input.addEventListener("input", () => {
	const query = input.value;
	fetch(`/search?q=${encodeURIComponent(query)}`)
		.then(res => res.json())
		.then(handleSearchResults);
});

downloadBtn.addEventListener("click", () => {
	if (currentViewedPath) {
		const link = document.createElement("a");
		link.href = `/download?q=${encodeURIComponent(currentViewedPath)}`;
		link.download = ""; // This hints to the browser to download
		link.click();
	}
});


toggleDarkLight.addEventListener("click", () => {
  iconTheme.classList.toggle("fa-moon");
  iconTheme.classList.toggle("fa-sun");

  const themeColors = theme === "light" ? colors.dark : colors.light;
  Object.entries(themeColors).forEach(([varName, value]) => {
    document.documentElement.style.setProperty(varName, value);
  });

  theme = theme === "light" ? "dark" : "light";
});
