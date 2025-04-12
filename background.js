// background.js - Background script for the extension
console.log("ChatGPT Chat Saver background script initialized");

// When the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension installed or updated");
});

// Function to inject the script directly into the page
function injectScript(tabId) {
	console.log("Injecting script into tab:", tabId);

	// Using executeScript to inject a script tag that will load our inject.js
	chrome.scripting.executeScript({
		target: { tabId: tabId },
		function: () => {
			console.log("Executing script injection");

			// Create a script element to load inject.js
			const scriptTag = document.createElement('script');
			scriptTag.src = chrome.runtime.getURL('inject.js');
			scriptTag.id = 'chatSaverInjectedScript';
			scriptTag.onload = function () {
				console.log("inject.js loaded successfully");
				// Initialize the injected script immediately after loading
				if (window.chatSaverInit) {
					window.chatSaverInit();
				}
			};

			// Remove any existing script with the same ID
			const existingScript = document.getElementById('chatSaverInjectedScript');
			if (existingScript) {
				existingScript.remove();
			}

			// Add the script to the page
			(document.head || document.documentElement).appendChild(scriptTag);
			console.log("Script tag added to page");
		}
	});
}

// Listen for navigation events to chatgpt.com
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	// Only proceed if the URL matches ChatGPT
	if (tab.url && (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))) {
		console.log("ChatGPT page detected");

		// Wait for the page to be completely loaded
		if (changeInfo.status === 'complete') {
			console.log("Page fully loaded, injecting script");

			// Inject our script
			injectScript(tabId);

			// Also inject our content script directly
			chrome.scripting.executeScript({
				target: { tabId: tabId },
				files: ["content.js"]
			});
		}
	}
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Background received message:", message);

	// Handle showing the modal
	if (message.action === "showModal") {
		console.log("Received request to show modal");

		// Forward the message to the active tab
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			if (tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, { action: "showModal" }, function (response) {
					console.log("Response from content script:", response);
					sendResponse({ success: true, message: "Modal request forwarded" });
				});
			} else {
				sendResponse({ success: false, message: "No active tab found" });
			}
		});

		// Return true to indicate we'll respond asynchronously
		return true;
	}
});
