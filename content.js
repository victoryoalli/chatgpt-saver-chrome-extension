// content.js - Bridge between the page and the extension
console.log("ChatGPT Chat Saver content script loaded");

// Try to inject the script manually as a fallback method
function manuallyInjectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.id = 'chatSaverInjectedScript';
  (document.head || document.documentElement).appendChild(script);
  console.log("Manually injected script tag");
}

// Listen for the saveChatEvent from the injected script
document.addEventListener('saveChatEvent', function (e) {
	console.log("Received saveChatEvent from injected script");

	// Get the chat data from the event
	const chatData = e.detail;

	// Get existing chats or create empty array
	getChatData().then(existingChats => {
		// Create a unique ID
		const chatId = Date.now().toString();

		// Add the new chat with an ID
		const newChat = {
			id: chatId,
			...chatData
		};

		existingChats.push(newChat);

		// Save to Chrome storage
		chrome.storage.local.set({ 'savedChats': existingChats }, () => {
			console.log("Chat saved to storage");
			alert(`Chat saved with label: ${chatData.label}`);
		});
	});
});

// Listen for the showModalFromInject event
document.addEventListener('showModalFromInject', function () {
	console.log("Received showModalFromInject event");
	showModal();
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Content script received message:", message);

	if (message.action === "showModal") {
		console.log("Showing modal from message");
		showModal();
		sendResponse({ success: true });
	}

	// Return true to indicate we'll respond asynchronously
	return true;
});

function getChatData() {
	return new Promise((resolve) => {
		chrome.storage.local.get('savedChats', (result) => {
			resolve(result.savedChats || []);
		});
	});
}

function showModal() {
	console.log("Showing chat modal");
	// Create modal if it doesn't exist
	let modal = document.getElementById('chatSaverModal');
	if (!modal) {
		modal = document.createElement('div');
		modal.id = 'chatSaverModal';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '10000000'; // Extremely high z-index
		modal.style.display = 'flex';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		const modalContent = document.createElement('div');
		modalContent.style.backgroundColor = 'white';
		modalContent.style.borderRadius = '8px';
		modalContent.style.padding = '20px';
		modalContent.style.width = '80%';
		modalContent.style.maxHeight = '80%';
		modalContent.style.overflowY = 'auto';
		modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
		modalContent.style.position = 'relative'; // Add this for proper close button positioning

		// Create close button
		const closeButton = document.createElement('button');
		closeButton.textContent = '✕';
		closeButton.style.position = 'absolute';
		closeButton.style.top = '10px';
		closeButton.style.right = '15px';
		closeButton.style.background = 'none';
		closeButton.style.border = 'none';
		closeButton.style.fontSize = '20px';
		closeButton.style.cursor = 'pointer';
		closeButton.style.color = '#333';
		closeButton.addEventListener('click', () => {
			modal.style.display = 'none';
		});

		// Create title
		const title = document.createElement('h2');
		title.textContent = 'Saved Chats';
		title.style.marginTop = '0';
		title.style.marginBottom = '20px';
		title.style.color = '#333';

		// Create filter section
		const filterSection = document.createElement('div');
		filterSection.style.marginBottom = '20px';
		filterSection.style.display = 'flex';
		filterSection.style.alignItems = 'center';

		const filterLabel = document.createElement('label');
		filterLabel.textContent = 'Filter by label:';
		filterLabel.style.marginRight = '10px';

		const filterInput = document.createElement('input');
		filterInput.type = 'text';
		filterInput.id = 'labelFilter';
		filterInput.style.padding = '8px';
		filterInput.style.border = '1px solid #ddd';
		filterInput.style.borderRadius = '4px';
		filterInput.style.marginRight = '10px';
		filterInput.style.width = '200px';

		const filterButton = document.createElement('button');
		filterButton.textContent = 'Filter';
		filterButton.style.padding = '8px 15px';
		filterButton.style.backgroundColor = '#10a37f';
		filterButton.style.color = 'white';
		filterButton.style.border = 'none';
		filterButton.style.borderRadius = '4px';
		filterButton.style.cursor = 'pointer';

		filterSection.appendChild(filterLabel);
		filterSection.appendChild(filterInput);
		filterSection.appendChild(filterButton);

		// Create chats container
		const chatsContainer = document.createElement('div');
		chatsContainer.id = 'savedChatsContainer';

		// Assemble modal content
		modalContent.appendChild(closeButton);
		modalContent.appendChild(title);
		modalContent.appendChild(filterSection);
		modalContent.appendChild(chatsContainer);
		modal.appendChild(modalContent);

		// Add to page
		document.body.appendChild(modal);

		// Set up event handlers
		filterButton.addEventListener('click', filterChats);
		filterInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				filterChats();
			}
		});

		// Initial load of chats
		loadChats();

		console.log("Modal created and added to page");
	} else {
		// If modal exists, just show it and refresh content
		modal.style.display = 'flex';
		loadChats();
		console.log("Showing existing modal");
	}
}

async function loadChats(filterText = '') {
	console.log("Loading chats with filter:", filterText || "none");
	const chatsContainer = document.getElementById('savedChatsContainer');
	const chats = await getChatData();

	// Clear existing content
	chatsContainer.innerHTML = '';

	if (chats.length === 0) {
		chatsContainer.innerHTML = '<p style="text-align: center; color: #666;">No saved chats found.</p>';
		return;
	}

	// Filter chats if filter text is provided
	const filteredChats = filterText ?
		chats.filter(chat => chat.label.toLowerCase().includes(filterText.toLowerCase())) :
		chats;

	if (filteredChats.length === 0) {
		chatsContainer.innerHTML = '<p style="text-align: center; color: #666;">No chats match the filter criteria.</p>';
		return;
	}

	// Group chats by label
	const chatsByLabel = {};
	filteredChats.forEach(chat => {
		if (!chatsByLabel[chat.label]) {
			chatsByLabel[chat.label] = [];
		}
		chatsByLabel[chat.label].push(chat);
	});

	// Create a section for each label
	Object.keys(chatsByLabel).sort().forEach(label => {
		const labelSection = document.createElement('div');
		labelSection.style.marginBottom = '25px';

		const labelHeader = document.createElement('h3');
		labelHeader.textContent = label;
		labelHeader.style.borderBottom = '2px solid #eee';
		labelHeader.style.paddingBottom = '8px';
		labelHeader.style.color = '#10a37f';

		labelSection.appendChild(labelHeader);

		// Add each chat under this label
		chatsByLabel[label].forEach(chat => {
			const chatItem = document.createElement('div');
			chatItem.style.padding = '12px';
			chatItem.style.margin = '8px 0';
			chatItem.style.backgroundColor = '#f9f9f9';
			chatItem.style.borderRadius = '6px';
			chatItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

			const chatTitle = document.createElement('div');
			chatTitle.textContent = chat.title;
			chatTitle.style.fontWeight = 'bold';
			chatTitle.style.fontSize = '16px';

			const chatDate = document.createElement('div');
			chatDate.textContent = new Date(chat.timestamp).toLocaleString();
			chatDate.style.fontSize = '12px';
			chatDate.style.color = '#666';
			chatDate.style.marginTop = '3px';

			const buttonsContainer = document.createElement('div');
			buttonsContainer.style.marginTop = '10px';
			buttonsContainer.style.display = 'flex';
			buttonsContainer.style.gap = '8px';

			const viewButton = document.createElement('button');
			viewButton.textContent = 'View';
			viewButton.style.padding = '6px 12px';
			viewButton.style.backgroundColor = '#2196F3';
			viewButton.style.color = 'white';
			viewButton.style.border = 'none';
			viewButton.style.borderRadius = '4px';
			viewButton.style.cursor = 'pointer';
			viewButton.addEventListener('click', () => {
				viewChat(chat);
			});

			const deleteButton = document.createElement('button');
			deleteButton.textContent = 'Delete';
			deleteButton.style.padding = '6px 12px';
			deleteButton.style.backgroundColor = '#f44336';
			deleteButton.style.color = 'white';
			deleteButton.style.border = 'none';
			deleteButton.style.borderRadius = '4px';
			deleteButton.style.cursor = 'pointer';
			deleteButton.addEventListener('click', () => {
				deleteChat(chat.id);
			});

			buttonsContainer.appendChild(viewButton);
			buttonsContainer.appendChild(deleteButton);

			chatItem.appendChild(chatTitle);
			chatItem.appendChild(chatDate);
			chatItem.appendChild(buttonsContainer);

			labelSection.appendChild(chatItem);
		});

		chatsContainer.appendChild(labelSection);
	});

	console.log("Chats loaded successfully");
}

function filterChats() {
	const filterText = document.getElementById('labelFilter').value;
	loadChats(filterText);
}

function viewChat(chat) {
	console.log("Viewing chat:", chat.id);

	// Create a new tab to view the chat content
	const viewWindow = window.open('', '_blank');
	viewWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${chat.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 15px;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          h1 {
            margin: 0 0 10px 0;
            color: #10a37f;
          }
          .close-button {
            padding: 8px 16px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .chat-container {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .chat-info div {
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="chat-info">
            <h1>${chat.title}</h1>
            <div><strong>Label:</strong> ${chat.label}</div>
            <div><strong>Saved on:</strong> ${new Date(chat.timestamp).toLocaleString()}</div>
          </div>
          <button class="close-button" onclick="window.close()">Close</button>
        </header>
        <div class="chat-container">
          ${chat.content}
        </div>
      </body>
    </html>
  `);
}

async function deleteChat(chatId) {
	if (!confirm('Are you sure you want to delete this chat?')) return;

	console.log("Deleting chat:", chatId);

	const chats = await getChatData();
	const updatedChats = chats.filter(chat => chat.id !== chatId);

	chrome.storage.local.set({ 'savedChats': updatedChats }, () => {
		loadChats(document.getElementById('labelFilter').value);
		console.log("Chat deleted successfully");
	});
}

// Try to inject our script manually as a fallback
setTimeout(() => {
  // Check if the Save button exists, if not, try manual injection
  if (!document.getElementById('chatSaverButton')) {
    console.log("Save button not found, attempting manual script injection");
    manuallyInjectScript();
  }
}, 2000);

console.log("Content script initialization complete");
