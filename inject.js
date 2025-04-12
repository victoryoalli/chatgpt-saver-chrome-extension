// inject.js - Directly injected into the page
console.log("ChatGPT Chat Saver injected script loaded");

// Global init function that can be called from the background script
window.chatSaverInit = function () {
	console.log("Initializing ChatGPT Chat Saver from global init");
	createSaveButton();
	setupObserver();
};

// Keep track of the current chat URL
let currentChatUrl = window.location.href;

// Function to normalize a ChatGPT URL by removing unnecessary parameters
// This helps with matching URLs even if they have different tracking parameters
function normalizeUrl(url) {
	try {
		const urlObj = new URL(url);
		// Keep only the pathname which contains the conversation ID
		return urlObj.origin + urlObj.pathname;
	} catch (e) {
		console.error("Error normalizing URL:", e);
		return url;
	}
}

// Create our UI elements
function createSaveButton() {
	console.log("Creating save button from injected script");

	// Check if button already exists
	if (document.getElementById('chatSaverButton')) {
		console.log("Button already exists");
		return;
	}

	// Create a floating button
	const buttonContainer = document.createElement('div');
	buttonContainer.id = 'chatSaverButton';
	buttonContainer.style.position = 'fixed';
	buttonContainer.style.top = '80px'; // Move down to avoid overlap with ChatGPT UI elements
	buttonContainer.style.right = '20px';
	buttonContainer.style.zIndex = '9999999'; // Very high z-index
	buttonContainer.style.backgroundColor = '#10a37f'; // ChatGPT green
	buttonContainer.style.color = 'white';
	buttonContainer.style.padding = '10px 15px';
	buttonContainer.style.borderRadius = '5px';
	buttonContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
	buttonContainer.style.cursor = 'pointer';
	buttonContainer.style.fontWeight = 'bold';
	buttonContainer.style.fontSize = '14px';
	buttonContainer.style.fontFamily = 'Arial, sans-serif';
	buttonContainer.textContent = 'Save Chat';
	buttonContainer.style.userSelect = 'none'; // Prevent text selection
	buttonContainer.style.transition = 'all 0.2s ease'; // Add transition for smoother hover effect

	// Add hover effects
	buttonContainer.onmouseover = function () {
		this.style.backgroundColor = '#0d8c6c';
		this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
	};

	buttonContainer.onmouseout = function () {
		this.style.backgroundColor = '#10a37f';
		this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
	};

	// Add click handler
	buttonContainer.addEventListener('click', saveCurrentChat);

	// Add to page
	document.body.appendChild(buttonContainer);
	console.log("Save button added to page");

	// Check if this chat is already saved - use normalized URL
	checkIfChatIsSaved(normalizeUrl(window.location.href));
}

// Function to reset the button to unsaved state
function resetButtonToUnsavedState() {
	const button = document.getElementById('chatSaverButton');
	if (button) {
		console.log("Resetting button to unsaved state");
		button.textContent = 'Save Chat';
		button.style.backgroundColor = '#10a37f';
		button.style.cursor = 'pointer';

		// Clone the button to remove all event listeners
		const newButton = button.cloneNode(true);
		button.parentNode.replaceChild(newButton, button);

		// Add hover effects
		newButton.onmouseover = function () {
			this.style.backgroundColor = '#0d8c6c';
			this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
		};

		newButton.onmouseout = function () {
			this.style.backgroundColor = '#10a37f';
			this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
		};

		// Add click handler
		newButton.addEventListener('click', saveCurrentChat);
	}
}

// Check if the current chat is already saved
function checkIfChatIsSaved(url) {
	console.log("Checking if chat is saved:", url);
	// Reset button to default state before checking
	resetButtonToUnsavedState();
	// We need to communicate with the content script to check storage
	const event = new CustomEvent('checkIfSaved', { detail: { url: url } });
	document.dispatchEvent(event);
}

// Create a notification without using inline scripting
function showNotification(message, type = 'success') {
	// Remove any existing notification
	const existingNotification = document.getElementById('chatSaverNotification');
	if (existingNotification) {
		existingNotification.remove();
	}

	// Create notification container
	const notification = document.createElement('div');
	notification.id = 'chatSaverNotification';
	notification.style.position = 'fixed';
	notification.style.top = '20px';
	notification.style.left = '50%';
	notification.style.transform = 'translateX(-50%)';
	notification.style.padding = '12px 24px';
	notification.style.borderRadius = '6px';
	notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
	notification.style.zIndex = '10000000';
	notification.style.fontFamily = 'Arial, sans-serif';
	notification.style.fontSize = '14px';
	notification.style.fontWeight = 'bold';
	notification.style.transition = 'all 0.3s ease';
	notification.style.opacity = '0';

	// Set style based on type
	if (type === 'success') {
		notification.style.backgroundColor = '#4CAF50';
		notification.style.color = 'white';
	} else if (type === 'error') {
		notification.style.backgroundColor = '#f44336';
		notification.style.color = 'white';
	} else if (type === 'info') {
		notification.style.backgroundColor = '#2196F3';
		notification.style.color = 'white';
	}

	notification.textContent = message;

	// Add to page
	document.body.appendChild(notification);

	// Animate in
	setTimeout(() => {
		notification.style.opacity = '1';
	}, 10);

	// Auto remove after 3 seconds
	setTimeout(() => {
		notification.style.opacity = '0';
		setTimeout(() => {
			notification.remove();
		}, 300);
	}, 3000);
}

// Function to actually save the chat
function saveCurrentChat() {
	console.log("Save chat button clicked");

	// Create a custom dialog instead of using prompt
	showSaveDialog();
}

// Function to show a custom save dialog
function showSaveDialog() {
	// Remove any existing dialog
	const existingDialog = document.getElementById('chatSaverDialog');
	if (existingDialog) {
		existingDialog.remove();
	}

	// Create dialog backdrop
	const backdrop = document.createElement('div');
	backdrop.style.position = 'fixed';
	backdrop.style.top = '0';
	backdrop.style.left = '0';
	backdrop.style.width = '100%';
	backdrop.style.height = '100%';
	backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	backdrop.style.zIndex = '10000000';
	backdrop.style.display = 'flex';
	backdrop.style.justifyContent = 'center';
	backdrop.style.alignItems = 'center';

	// Create dialog container
	const dialog = document.createElement('div');
	dialog.id = 'chatSaverDialog';
	dialog.style.backgroundColor = 'white';
	dialog.style.borderRadius = '8px';
	dialog.style.padding = '24px';
	dialog.style.minWidth = '320px';
	dialog.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';

	// Create dialog title
	const title = document.createElement('h3');
	title.textContent = 'Save Chat';
	title.style.margin = '0 0 16px 0';
	title.style.color = '#333';
	title.style.fontFamily = 'Arial, sans-serif';

	// Create labels container
	const labelsContainer = document.createElement('div');
	labelsContainer.style.marginBottom = '16px';
	labelsContainer.style.display = 'flex';
	labelsContainer.style.flexWrap = 'wrap';
	labelsContainer.style.gap = '8px';

	// Create label input
	const labelInput = document.createElement('input');
	labelInput.type = 'text';
	labelInput.placeholder = 'Enter a label for this chat';
	labelInput.style.width = '100%';
	labelInput.style.padding = '10px';
	labelInput.style.marginBottom = '16px';
	labelInput.style.boxSizing = 'border-box';
	labelInput.style.border = '1px solid #ddd';
	labelInput.style.borderRadius = '4px';

	// Create buttons container
	const buttonsContainer = document.createElement('div');
	buttonsContainer.style.display = 'flex';
	buttonsContainer.style.justifyContent = 'flex-end';
	buttonsContainer.style.gap = '8px';

	// Create cancel button
	const cancelButton = document.createElement('button');
	cancelButton.textContent = 'Cancel';
	cancelButton.style.padding = '8px 16px';
	cancelButton.style.border = '1px solid #ddd';
	cancelButton.style.borderRadius = '4px';
	cancelButton.style.backgroundColor = '#f5f5f5';
	cancelButton.style.cursor = 'pointer';

	// Create save button
	const saveButton = document.createElement('button');
	saveButton.textContent = 'Save';
	saveButton.style.padding = '8px 16px';
	saveButton.style.border = 'none';
	saveButton.style.borderRadius = '4px';
	saveButton.style.backgroundColor = '#10a37f';
	saveButton.style.color = 'white';
	saveButton.style.cursor = 'pointer';

	// Function to create a label badge
	function createLabelBadge(labelText) {
		const badge = document.createElement('div');
		badge.style.backgroundColor = '#e0f2f1';
		badge.style.color = '#00796b';
		badge.style.padding = '4px 12px';
		badge.style.borderRadius = '16px';
		badge.style.fontSize = '14px';
		badge.style.cursor = 'pointer';
		badge.style.transition = 'all 0.2s ease';
		badge.textContent = labelText;

		badge.addEventListener('mouseover', () => {
			badge.style.backgroundColor = '#b2dfdb';
		});

		badge.addEventListener('mouseout', () => {
			badge.style.backgroundColor = '#e0f2f1';
		});

		badge.addEventListener('click', () => {
			labelInput.value = labelText;
		});

		return badge;
	}

	// Function to load existing labels
	function loadExistingLabels() {
		// Create and dispatch a custom event to get the labels
		const event = new CustomEvent('getExistingLabels');
		document.dispatchEvent(event);

		// Listen for the response event
		document.addEventListener('existingLabelsResponse', function handler(e) {
			// Remove the listener to avoid memory leaks
			document.removeEventListener('existingLabelsResponse', handler);

			// Clear existing labels
			labelsContainer.innerHTML = '';

			// Add label badges
			e.detail.labels.forEach(label => {
				const badge = createLabelBadge(label);
				labelsContainer.appendChild(badge);
			});
		});
	}

	// Load existing labels
	loadExistingLabels();

	// Add event listeners
	cancelButton.addEventListener('click', () => {
		backdrop.remove();
	});

	saveButton.addEventListener('click', () => {
		const label = labelInput.value.trim();
		if (label) {
			processAndSaveChat(label);
			backdrop.remove();
		} else {
			labelInput.style.border = '1px solid #f44336';
			labelInput.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
		}
	});

	// Handle enter key on input
	labelInput.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			saveButton.click();
		}
	});

	// Assemble dialog
	buttonsContainer.appendChild(cancelButton);
	buttonsContainer.appendChild(saveButton);
	dialog.appendChild(title);
	dialog.appendChild(labelsContainer);
	dialog.appendChild(labelInput);
	dialog.appendChild(buttonsContainer);
	backdrop.appendChild(dialog);

	// Add to page
	document.body.appendChild(backdrop);

	// Focus input
	labelInput.focus();
}

// Process and save the chat with the given label
function processAndSaveChat(label) {
	console.log("Saving chat with label:", label);

	// Extract the URL and normalize it
	const chatUrl = normalizeUrl(window.location.href);

	// Extract the chat title
	let title = 'ChatGPT Conversation';
	const titleElement = document.querySelector('nav span.truncate') ||
		document.querySelector('h1') ||
		document.querySelector('title');

	if (titleElement) {
		title = titleElement.textContent.trim();
	}

	// Create minimized data object - only storing what's needed
	const chatData = {
		label: label,
		title: title,
		timestamp: new Date().toISOString(),
		url: chatUrl // Store normalized URL
	};

	// Dispatch event with the data
	const event = new CustomEvent('saveChatEvent', { detail: chatData });
	document.dispatchEvent(event);

	console.log("Dispatched save event with chat data");
}

// Set up an observer to make sure our button is added even if the page changes
function setupObserver() {
	// Create a MutationObserver to watch for DOM changes
	const observer = new MutationObserver((mutations) => {
		// If our button doesn't exist, create it
		if (!document.getElementById('chatSaverButton')) {
			createSaveButton();
		}
	});

	// Start observing
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	console.log("Observer set up to maintain button");
}

// Improved URL change detection with history API monitoring
function setupUrlChangeDetection() {
	// Store original methods
	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;

	// Override history.pushState
	history.pushState = function () {
		originalPushState.apply(this, arguments);
		handleUrlChange();
	};

	// Override history.replaceState
	history.replaceState = function () {
		originalReplaceState.apply(this, arguments);
		handleUrlChange();
	};

	// Handle popstate events (back/forward browser buttons)
	window.addEventListener('popstate', function () {
		handleUrlChange();
	});

	// Fallback for other navigation methods
	setInterval(() => {
		const newUrl = window.location.href;
		if (newUrl !== currentChatUrl) {
			currentChatUrl = newUrl;
			handleUrlChange();
		}
	}, 500);

	console.log("URL change detection enhanced with History API monitoring");
}

// Function to handle URL changes
function handleUrlChange() {
	const newUrl = window.location.href;
	console.log("URL changed to:", newUrl);

	setTimeout(() => {
	  const normalizedUrl = normalizeUrl(newUrl);
	  console.log("Checking if new chat is saved after navigation");

	  // Remove and re-add the button to ensure clean state
	  const existingButton = document.getElementById('chatSaverButton');
	  if (existingButton) {
	    existingButton.remove();
	  }

	  createSaveButton(); // This will call checkIfChatIsSaved internally
	}, 500);
      }


// Listen for the showModal event (from extension)
document.addEventListener('showChatModal', () => {
	console.log("Received showChatModal event");
	// We need to dispatch this to the content script
	const event = new CustomEvent('showModalFromInject');
	document.dispatchEvent(event);
});

// Initialize on script load
createSaveButton();
setupObserver();
setupUrlChangeDetection();

// Initial check if this chat is already saved
checkIfChatIsSaved(normalizeUrl(window.location.href));

console.log("Injected script fully loaded with URL change detection improvements");
