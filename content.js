// content.js - Bridge between the page and the extension
console.log("ChatGPT Chat Saver content script loaded");

// Function to normalize a ChatGPT URL by removing unnecessary parameters
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

// Try to inject the script manually as a fallback method
function manuallyInjectScript() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.id = 'chatSaverInjectedScript';
    (document.head || document.documentElement).appendChild(script);
    console.log("Manually injected script tag");
  } catch (e) {
    console.error("Error injecting script:", e);
  }
}

// Listen for the saveChatEvent from the injected script
document.addEventListener('saveChatEvent', function (e) {
  console.log("Received saveChatEvent from injected script");

  // Get the chat data from the event
  const chatData = e.detail;

  // Get existing chats or create empty array
  getChatData().then(existingChats => {
    // Check if this chat URL already exists
    const normalizedUrl = normalizeUrl(chatData.url);
    const existingChatIndex = existingChats.findIndex(chat => normalizeUrl(chat.url) === normalizedUrl);

    if (existingChatIndex !== -1) {
      console.log("Chat already exists, updating label and timestamp");

      // Update the existing chat with new label and timestamp
      existingChats[existingChatIndex].label = chatData.label;
      existingChats[existingChatIndex].timestamp = chatData.timestamp;

      // Save updated chats
      chrome.storage.local.set({ 'savedChats': existingChats }, () => {
        console.log("Chat updated in storage");

        // Update button state via direct DOM manipulation
        updateButtonToSavedState();

        // Show notification safely
        showNotificationSafe(`Chat updated with label: ${chatData.label}`, "success");
      });

      return;
    }

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

      // Update button state via direct DOM manipulation
      updateButtonToSavedState();

      // Show notification safely
      showNotificationSafe(`Chat saved with label: ${chatData.label}`, "success");
    });
  });
});

// Update button to saved state using DOM manipulation instead of script injection
function updateButtonToSavedState() {
  const button = document.getElementById('chatSaverButton');
  if (button) {
    console.log("Updating button to Saved state via DOM manipulation");
    button.textContent = 'Saved';
    button.style.backgroundColor = '#888';
    button.style.cursor = 'default';

    // Clone the button to remove all event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add new click handler that shows a notification
    newButton.addEventListener('click', () => {
      showNotificationSafe('This chat has already been saved', 'info');
    });
  }
}

// Listen for checkIfSaved event from injected script
document.addEventListener('checkIfSaved', function (e) {
  console.log("Checking if chat is already saved");

  const url = e.detail.url;

  getChatData().then(chats => {
    // Check if any chat has this URL using normalized URLs for comparison
    const normalizedUrl = normalizeUrl(url);
    console.log("Checking normalized URL:", normalizedUrl);

    // Debug log all saved URLs
    console.log("All saved URLs:");
    chats.forEach(chat => {
      console.log(`- ${chat.title}: ${normalizeUrl(chat.url)}`);
    });

    const isSaved = chats.some(chat => normalizeUrl(chat.url) === normalizedUrl);

    if (isSaved) {
      console.log("Chat is already saved - updating button directly");
      updateButtonToSavedState();
    } else {
      console.log("Chat is not saved yet");
    }
  });
});

// Safe notification method that doesn't use script injection
function showNotificationSafe(message, type = 'success') {
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
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.3s ease';

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

// URL change detection without script injection
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    console.log('URL changed from', lastUrl, 'to', location.href);
    lastUrl = location.href;

    // Add a delay to ensure page is loaded
    setTimeout(() => {
      console.log("Checking if new URL is saved");
      // Check if this URL is already saved
      const normalizedUrl = normalizeUrl(location.href);
      getChatData().then(chats => {
        const isSaved = chats.some(chat => normalizeUrl(chat.url) === normalizedUrl);
        if (isSaved) {
          updateButtonToSavedState();
        }
      });
    }, 500);
  }
});
observer.observe(document, { subtree: true, childList: true });

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
    modal.style.fontFamily = 'Arial, sans-serif';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '24px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflowY = 'auto';
    modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    modalContent.style.position = 'relative'; // Add this for proper close button positioning

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '16px';
    closeButton.style.right = '20px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    closeButton.style.transition = 'color 0.2s ease';
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.color = '#000';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.color = '#666';
    });
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Saved Chats';
    title.style.margin = '0 0 24px 0';
    title.style.color = '#10a37f';
    title.style.fontSize = '24px';

    // Create filter section
    const filterSection = document.createElement('div');
    filterSection.style.marginBottom = '24px';
    filterSection.style.display = 'flex';
    filterSection.style.alignItems = 'center';
    filterSection.style.gap = '10px';

    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Filter by label:';
    filterLabel.style.fontSize = '14px';
    filterLabel.style.color = '#666';

    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.id = 'labelFilter';
    filterInput.style.padding = '8px 12px';
    filterInput.style.border = '1px solid #ddd';
    filterInput.style.borderRadius = '4px';
    filterInput.style.flex = '1';
    filterInput.style.fontSize = '14px';

    const filterButton = document.createElement('button');
    filterButton.textContent = 'Filter';
    filterButton.style.padding = '8px 16px';
    filterButton.style.backgroundColor = '#10a37f';
    filterButton.style.color = 'white';
    filterButton.style.border = 'none';
    filterButton.style.borderRadius = '4px';
    filterButton.style.cursor = 'pointer';
    filterButton.style.fontSize = '14px';
    filterButton.style.transition = 'background-color 0.2s ease';
    filterButton.addEventListener('mouseover', () => {
      filterButton.style.backgroundColor = '#0d8c6c';
    });
    filterButton.addEventListener('mouseout', () => {
      filterButton.style.backgroundColor = '#10a37f';
    });

    filterSection.appendChild(filterLabel);
    filterSection.appendChild(filterInput);
    filterSection.appendChild(filterButton);

    // Create chats container
    const chatsContainer = document.createElement('div');
    chatsContainer.id = 'savedChatsContainer';
    chatsContainer.style.display = 'flex';
    chatsContainer.style.flexDirection = 'column';
    chatsContainer.style.gap = '16px';

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
    const emptyMessage = document.createElement('div');
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '40px 0';
    emptyMessage.style.color = '#666';
    emptyMessage.style.backgroundColor = '#f9f9f9';
    emptyMessage.style.borderRadius = '8px';
    emptyMessage.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <p style="margin-top: 16px; font-size: 16px;">No saved chats found.</p>
    `;
    chatsContainer.appendChild(emptyMessage);
    return;
  }

  // Filter chats if filter text is provided
  const filteredChats = filterText ?
    chats.filter(chat => chat.label.toLowerCase().includes(filterText.toLowerCase())) :
    chats;

  if (filteredChats.length === 0) {
    const noMatchMessage = document.createElement('div');
    noMatchMessage.style.textAlign = 'center';
    noMatchMessage.style.padding = '40px 0';
    noMatchMessage.style.color = '#666';
    noMatchMessage.style.backgroundColor = '#f9f9f9';
    noMatchMessage.style.borderRadius = '8px';
    noMatchMessage.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <p style="margin-top: 16px; font-size: 16px;">No chats match the filter criteria.</p>
    `;
    chatsContainer.appendChild(noMatchMessage);
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
    labelSection.style.marginBottom = '24px';

    const labelHeader = document.createElement('div');
    labelHeader.style.borderBottom = '2px solid #eee';
    labelHeader.style.paddingBottom = '8px';
    labelHeader.style.marginBottom = '12px';
    labelHeader.style.color = '#10a37f';
    labelHeader.style.fontWeight = 'bold';
    labelHeader.style.fontSize = '18px';
    labelHeader.textContent = label;

    labelSection.appendChild(labelHeader);

    // Chat list for this label
    const chatList = document.createElement('div');
    chatList.style.display = 'flex';
    chatList.style.flexDirection = 'column';
    chatList.style.gap = '8px';

    // Add each chat under this label
    chatsByLabel[label].forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.style.padding = '12px';
      chatItem.style.backgroundColor = '#f9f9f9';
      chatItem.style.borderRadius = '6px';
      chatItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      chatItem.style.display = 'flex';
      chatItem.style.justifyContent = 'space-between';
      chatItem.style.alignItems = 'center';
      chatItem.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

      // Add hover effect
      chatItem.addEventListener('mouseover', () => {
        chatItem.style.transform = 'translateY(-2px)';
        chatItem.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      });

      chatItem.addEventListener('mouseout', () => {
        chatItem.style.transform = 'translateY(0)';
        chatItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      });

      // Left section with title and timestamp
      const chatInfo = document.createElement('div');
      chatInfo.style.display = 'flex';
      chatInfo.style.flexDirection = 'column';
      chatInfo.style.gap = '4px';
      chatInfo.style.flex = '1';
      chatInfo.style.overflow = 'hidden'; // Prevent title from overflowing

      // Make the title clickable to open the chat
      const chatTitle = document.createElement('a');
      chatTitle.textContent = chat.title;
      chatTitle.href = chat.url;
      // No target="_blank" so it opens in the current window
      chatTitle.style.fontWeight = 'bold';
      chatTitle.style.fontSize = '16px';
      chatTitle.style.color = '#333';
      chatTitle.style.textDecoration = 'none';
      chatTitle.style.display = 'block';
      chatTitle.style.whiteSpace = 'nowrap';
      chatTitle.style.overflow = 'hidden';
      chatTitle.style.textOverflow = 'ellipsis';

      const chatDate = document.createElement('div');
      chatDate.textContent = new Date(chat.timestamp).toLocaleString();
      chatDate.style.fontSize = '12px';
      chatDate.style.color = '#666';

      chatInfo.appendChild(chatTitle);
      chatInfo.appendChild(chatDate);

      // Right section with action buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '8px';

      const viewButton = document.createElement('a');
      viewButton.textContent = 'View';
      viewButton.href = chat.url;
      // No target="_blank" so it opens in the current window
      viewButton.style.padding = '6px 12px';
      viewButton.style.backgroundColor = '#2196F3';
      viewButton.style.color = 'white';
      viewButton.style.border = 'none';
      viewButton.style.borderRadius = '4px';
      viewButton.style.cursor = 'pointer';
      viewButton.style.textDecoration = 'none';
      viewButton.style.fontSize = '14px';
      viewButton.style.display = 'inline-block';
      viewButton.style.transition = 'background-color 0.2s ease';

      viewButton.addEventListener('mouseover', () => {
        viewButton.style.backgroundColor = '#0b7dda';
      });

      viewButton.addEventListener('mouseout', () => {
        viewButton.style.backgroundColor = '#2196F3';
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.style.padding = '6px 12px';
      deleteButton.style.backgroundColor = '#f44336';
      deleteButton.style.color = 'white';
      deleteButton.style.border = 'none';
      deleteButton.style.borderRadius = '4px';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.fontSize = '14px';
      deleteButton.style.transition = 'background-color 0.2s ease';

      deleteButton.addEventListener('mouseover', () => {
        deleteButton.style.backgroundColor = '#d32f2f';
      });

      deleteButton.addEventListener('mouseout', () => {
        deleteButton.style.backgroundColor = '#f44336';
      });

      deleteButton.addEventListener('click', () => {
        deleteChat(chat.id);
      });

      buttonsContainer.appendChild(viewButton);
      buttonsContainer.appendChild(deleteButton);

      chatItem.appendChild(chatInfo);
      chatItem.appendChild(buttonsContainer);

      chatList.appendChild(chatItem);
    });

    labelSection.appendChild(chatList);
    chatsContainer.appendChild(labelSection);
  });

  console.log("Chats loaded successfully");
}

function filterChats() {
  const filterText = document.getElementById('labelFilter').value;
  loadChats(filterText);
}

async function deleteChat(chatId) {
  // Create a confirmation dialog
  const confirmed = await showConfirmationDialog('Are you sure you want to delete this chat?');
  if (!confirmed) return;

  console.log("Deleting chat:", chatId);

  const chats = await getChatData();
  const updatedChats = chats.filter(chat => chat.id !== chatId);

  chrome.storage.local.set({ 'savedChats': updatedChats }, () => {
    loadChats(document.getElementById('labelFilter').value);

    // Show notification safely
    showNotificationSafe("Chat deleted successfully", "info");

    console.log("Chat deleted successfully");
  });
}

function showConfirmationDialog(message) {
  return new Promise((resolve) => {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '10000001'; // Higher than modal
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '8px';
    dialog.style.padding = '24px';
    dialog.style.maxWidth = '400px';
    dialog.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
    dialog.style.textAlign = 'center';

    // Add message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.marginTop = '0';
    messageEl.style.marginBottom = '20px';
    messageEl.style.fontSize = '16px';

    // Add buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '12px';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.border = '1px solid #ddd';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.backgroundColor = '#f5f5f5';
    cancelButton.style.cursor = 'pointer';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Delete';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.backgroundColor = '#f44336';
    confirmButton.style.color = 'white';
    confirmButton.style.cursor = 'pointer';

    // Add event listeners
    cancelButton.addEventListener('click', () => {
      backdrop.remove();
      resolve(false);
    });

    confirmButton.addEventListener('click', () => {
      backdrop.remove();
      resolve(true);
    });

    // Assemble dialog
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonsContainer);
    backdrop.appendChild(dialog);

    // Add to page
    document.body.appendChild(backdrop);
  });
}

// Check current URL on load
setTimeout(() => {
  console.log("Initial URL check for saved state");
  getChatData().then(chats => {
    const normalizedUrl = normalizeUrl(window.location.href);
    const isSaved = chats.some(chat => normalizeUrl(chat.url) === normalizedUrl);
    if (isSaved) {
      console.log("Current chat is saved, updating button state");
      updateButtonToSavedState();
    }
  });
}, 2000);

// Try to inject our script manually as a fallback
setTimeout(() => {
  // Check if the Save button exists, if not, try manual injection
  if (!document.getElementById('chatSaverButton')) {
    console.log("Save button not found, attempting manual script injection");
    manuallyInjectScript();
  }
}, 2000);

console.log("Content script initialization complete");

// Listen for getExistingLabels event from injected script
document.addEventListener('getExistingLabels', async function (e) {
  console.log("Getting existing labels");

  // Get all chats from storage
  const chats = await getChatData();

  // Extract unique labels
  const uniqueLabels = [...new Set(chats.map(chat => chat.label))].sort();

  // Dispatch response event with the labels
  const responseEvent = new CustomEvent('existingLabelsResponse', {
    detail: {
      labels: uniqueLabels
    }
  });
  document.dispatchEvent(responseEvent);
});
