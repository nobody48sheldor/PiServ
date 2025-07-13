const toggleDarkLight = document.getElementById("toggleDarkLight");
const iconTheme = document.getElementById("iconTheme");
const powerUserMode= document.getElementById("powerUserMode");
const iconMode = document.getElementById("iconMode");
const viewDoc = document.getElementById("viewDoc");
const iconView = document.getElementById("iconView");
const closeIconView = document.getElementById("closeIconView");

const iframeWrapper = document.getElementById("iframeWrapper");

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


let theme = localStorage.getItem('theme');
let mode = localStorage.getItem('mode');


const themeColors = theme === "light" ? colors.light : colors.dark;
Object.entries(themeColors).forEach(([varName, value]) => {
	document.documentElement.style.setProperty(varName, value);
});

if (theme === "light") {
	iconTheme.classList.add("fa-moon");
	iconTheme.classList.remove("fa-sun");
} if (theme === "dark") {
	iconTheme.classList.add("fa-sun");
	iconTheme.classList.remove("fa-moon");
} else {
}


if (mode === "default") {
	iconMode.classList.add("fa-terminal");
	iconMode.classList.remove("fa-laptop");
} if (mode === "powermode") {
	iconMode.classList.add("fa-laptop");
	iconMode.classList.remove("fa-terminal");
} else {
}




async function setMode(mode) {
	event.preventDefault();
	const response = await fetch('/mode', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ mode: mode})
	})
	const data = await response.json();
	return data.result;
}


toggleDarkLight.addEventListener("click", () => {

	const themeColors = theme === "light" ? colors.dark : colors.light;
	Object.entries(themeColors).forEach(([varName, value]) => {
		document.documentElement.style.setProperty(varName, value);
	});

	theme = theme === "light" ? "dark" : "light";

	if (theme === "light") {
		iconTheme.classList.add("fa-moon");
		iconTheme.classList.remove("fa-sun");
		localStorage.setItem('theme', 'light');
	} if (theme === "dark") {
		iconTheme.classList.add("fa-sun");
		iconTheme.classList.remove("fa-moon");
		localStorage.setItem('theme', 'dark');
	} else {
	}
});


powerUserMode.addEventListener("click", async () => {
	if (mode === "powermode") {
		iconMode.classList.add("fa-laptop");
		iconMode.classList.remove("fa-terminal");
		localStorage.setItem('mode', 'default');
	} else {
		iconMode.classList.add("fa-terminal");
		iconMode.classList.remove("fa-laptop");
		localStorage.setItem('mode', 'powermode');
	}
	mode = localStorage.getItem('mode');
	const response_serv = await setMode(mode);
	if (response_serv === 1) {
		if (mode === "powermode") {
			window.location.href = '/powermode';
		} else {
			window.location.href = '/';
		}
	} else {
		if (mode === "powermode") {
			iconMode.classList.add("fa-laptop");
			iconMode.classList.remove("fa-terminal");
			localStorage.setItem('mode', 'default');
		} else {
			iconMode.classList.add("fa-terminal");
			iconMode.classList.remove("fa-laptop");
			localStorage.setItem('mode', 'powermode');
		}
		mode = localStorage.getItem('mode');
	}
});

iconView.addEventListener("click", async () => {
	iframeWrapper.classList.add("overlay");
	iframeWrapper.classList.remove("iframeWrapper");
	iconView.classList.add("hidden");
	closeIconView.classList.remove("hidden");
});

closeIconView.addEventListener("click", async () => {
	iframeWrapper.classList.remove("overlay");
	iframeWrapper.classList.add("iframeWrapper");
	iconView.classList.remove("hidden");
	closeIconView.classList.add("hidden");
});
