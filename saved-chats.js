// saved-chats.js - Script for the saved chats page
document.addEventListener('DOMContentLoaded', function () {
	const chatsContainer = document.getElementById('chatsContainer');
	const filterInput = document.getElementById('labelFilter');
	const filterBtn = document.getElementById('filterBtn');
	const notification = document.getElementById('notification');

	// Load chats when the page loads
	loadChats();

	// Set up event handlers
	filterBtn.addEventListener('click', function() {
	  loadChats(filterInput.value);
	});

	filterInput.addEventListener('keypress', function(e) {
	  if (e.key === 'Enter') {
	    loadChats(filterInput.value);
	  }
	});

	// Load chats from storage
	function loadChats(filterText = '') {
	  chrome.storage.local.get('savedChats', function(result) {
	    const chats = result.savedChats || [];

	    // Clear existing content
	    chatsContainer.innerHTML = '';

	    if (chats.length === 0) {
	      chatsContainer.innerHTML = '<div class="no-chats">No saved chats found.</div>';
	      return;
	    }

	    // Filter chats if filter text is provided
	    const filteredChats = filterText ?
	      chats.filter(chat => chat.label.toLowerCase().includes(filterText.toLowerCase())) :
	      chats;

	    if (filteredChats.length === 0) {
	      chatsContainer.innerHTML = '<div class="no-chats">No chats match the filter criteria.</div>';
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
	      labelSection.className = 'label-section';

	      const labelHeader = document.createElement('h3');
	      labelHeader.className = 'label-header';
	      labelHeader.textContent = label;

	      labelSection.appendChild(labelHeader);

	      // Add each chat under this label
	      chatsByLabel[label].forEach(chat => {
		const chatItem = document.createElement('div');
		chatItem.className = 'chat-item';

		const chatTitle = document.createElement('div');
		chatTitle.className = 'chat-title';
		chatTitle.textContent = chat.title;
		chatTitle.addEventListener('click', function() {
		  // Open the original URL when the title is clicked
		  if (chat.url) {
		    window.open(chat.url, '_blank');
		  }
		});

		const chatMeta = document.createElement('div');
		chatMeta.className = 'chat-meta';

		const chatDate = document.createElement('div');
		chatDate.className = 'chat-date';
		chatDate.textContent = new Date(chat.timestamp).toLocaleString();

		const chatActions = document.createElement('div');
		chatActions.className = 'chat-actions';

		const viewButton = document.createElement('button');
		viewButton.className = 'btn btn-view';
		viewButton.textContent = 'View';
		viewButton.addEventListener('click', function() {
		  viewChat(chat);
		});

		const deleteButton = document.createElement('button');
		deleteButton.className = 'btn btn-delete';
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', function() {
		  deleteChat(chat.id);
		});

		chatActions.appendChild(viewButton);
		chatActions.appendChild(deleteButton);

		chatMeta.appendChild(chatDate);
		chatMeta.appendChild(chatActions);

		chatItem.appendChild(chatTitle);
		chatItem.appendChild(chatMeta);

		labelSection.appendChild(chatItem);
	      });

	      chatsContainer.appendChild(labelSection);
	    });
	  });
	}

	// View chat content in a new tab
	function viewChat(chat) {
	  // Create a new tab to view the chat content
	  const viewWindow = window.open('', '_blank');
	  viewWindow.document.write(`
	    <!DOCTYPE html>
	    <html>
	      <head>
		<title>${chat.title}</title>
		<style>
		  body {
		    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		    margin: 0;
		    padding: 20px;
		    line-height: 1.6;
		    color: #333;
		    background-color: #f8f9fa;
		  }
		  .container {
		    max-width: 900px;
		    margin: 0 auto;
		    background-color: white;
		    border-radius: 8px;
		    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		    padding: 20px;
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
		    transition: background-color 0.2s;
		  }
		  .close-button:hover {
		    background-color: #e53935;
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
		  .return-link {
		    display: inline-block;
		    margin-top: 15px;
		    color: #2196F3;
		    text-decoration: none;
		  }
		  .return-link:hover {
		    text-decoration: underline;
		  }
		</style>
	      </head>
	      <body>
		<div class="container">
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
		  <a href="${chat.url}" target="_blank" class="return-link">Open in ChatGPT</a>
		</div>
	      </body>
	    </html>
	  `);
	}

	// Delete a chat from storage
	function deleteChat(chatId) {
	  if (!confirm('Are you sure you want to delete this chat?')) return;

	  chrome.storage.local.get('savedChats', function(result) {
	    const chats = result.savedChats || [];
	    const updatedChats = chats.filter(chat => chat.id !== chatId);

	    chrome.storage.local.set({ 'savedChats': updatedChats }, function() {
	      // Show notification
	      showNotification('Chat deleted successfully');

	      // Reload the chats
	      loadChats(filterInput.value);
	    });
	  });
	}

	// Show notification
	function showNotification(message) {
	  notification.textContent = message;
	  notification.classList.add('show');

	  // Hide after 3 seconds
	  setTimeout(function() {
	    notification.classList.remove('show');
	  }, 3000);
	}
      });
