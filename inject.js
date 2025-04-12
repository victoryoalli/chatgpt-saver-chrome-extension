// inject.js - Directly injected into the page
console.log("ChatGPT Chat Saver injected script loaded");

// Global init function that can be called from the background script
window.chatSaverInit = function() {
  console.log("Initializing ChatGPT Chat Saver from global init");
  createSaveButton();
  setupObserver();
};

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

  // Add hover effects
  buttonContainer.onmouseover = function () {
    this.style.backgroundColor = '#0d8c6c';
  };

  buttonContainer.onmouseout = function () {
    this.style.backgroundColor = '#10a37f';
  };

  // Add click handler
  buttonContainer.addEventListener('click', saveCurrentChat);

  // Add to page
  document.body.appendChild(buttonContainer);
  console.log("Save button added to page");
}

// Function to actually save the chat
function saveCurrentChat() {
  console.log("Save chat button clicked");

  // Create a dialog for the user to input a label
  const label = prompt('Enter a label for this chat:');
  if (!label) {
    console.log("No label provided, cancelling save");
    return;
  }

  console.log("Saving chat with label:", label);

  // Try to find the chat content
  let chatContent = "";

  // Look for the main chat thread which contains the conversation
  const threadContainer = document.querySelector('main div.flex.flex-col.items-center.text-sm');

  if (threadContainer) {
    // Clone it to avoid any reference issues
    const threadClone = threadContainer.cloneNode(true);
    chatContent = threadClone.innerHTML;
    console.log("Found chat content in thread container");
  } else {
    // Try other common container elements
    const mainElement = document.querySelector('main');
    if (mainElement) {
      chatContent = mainElement.innerHTML;
      console.log("Found chat content in main element");
    } else {
      // Last resort fallback
      chatContent = document.body.innerHTML;
      console.log("Using body content as fallback");
    }
  }

  // Extract conversation title
  let title = 'ChatGPT Conversation';
  // Look for the conversation title in the nav element or h1
  const titleElement = document.querySelector('nav span.truncate') ||
                      document.querySelector('h1') ||
                      document.querySelector('title');

  if (titleElement) {
    title = titleElement.textContent.trim();
  }

  // Since we're in a page context, we need to communicate with the extension
  // via a custom event
  const chatData = {
    label: label,
    title: title,
    content: chatContent,
    timestamp: new Date().toISOString(),
    url: window.location.href
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

console.log("Injected script fully loaded");
