// popup.js - Popup script for the extension
document.addEventListener('DOMContentLoaded', function () {
	console.log("Popup loaded");

	// Add click handler for the view chats button
	document.getElementById('viewChats').addEventListener('click', function () {
	  console.log("View chats button clicked");

	  // Query for active tabs
	  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	    if (tabs.length > 0 && tabs[0].url &&
		(tabs[0].url.includes("chat.openai.com") || tabs[0].url.includes("chatgpt.com"))) {

	      console.log("Found active ChatGPT tab:", tabs[0].id);

	      // Try sending a message to the content script
	      chrome.tabs.sendMessage(tabs[0].id, { action: "showModal" }, function(response) {
		// Check for error
		if (chrome.runtime.lastError) {
		  console.log("Error sending message:", chrome.runtime.lastError.message);
		  // Try injection as fallback
		  injectContentScriptAndShowModal(tabs[0].id);
		} else {
		  console.log("Modal display request sent successfully");
		  // Close the popup after successful message
		  window.close();
		}
	      });
	    } else {
	      showNotChatGPTMessage();
	    }
	  });
	});

	// Function to inject the content script and show modal as fallback
	function injectContentScriptAndShowModal(tabId) {
	  console.log("Attempting to inject content script as fallback");

	  chrome.scripting.executeScript({
	    target: { tabId: tabId },
	    files: ["content.js"]
	  }, function() {
	    if (chrome.runtime.lastError) {
	      console.log("Content script injection failed:", chrome.runtime.lastError.message);
	      showErrorMessage("Failed to connect to ChatGPT page. Please refresh the page and try again.");
	    } else {
	      // Try again after injection
	      setTimeout(() => {
		chrome.tabs.sendMessage(tabId, { action: "showModal" }, function(response) {
		  if (chrome.runtime.lastError) {
		    console.log("Still failed after injection:", chrome.runtime.lastError.message);
		    showErrorMessage("Failed to connect to ChatGPT page. Please refresh the page and try again.");
		  } else {
		    console.log("Modal displayed after content script injection");
		    window.close();
		  }
		});
	      }, 500); // Give the content script time to initialize
	    }
	  });
	}

	// Function to display error when not on ChatGPT
	function showNotChatGPTMessage() {
	  const errorDiv = document.createElement('div');
	  errorDiv.className = 'error-message';
	  errorDiv.textContent = 'Please navigate to chat.openai.com to use this extension.';

	  // Insert after the button
	  document.body.appendChild(errorDiv);

	  // Style the error message
	  errorDiv.style.color = 'red';
	  errorDiv.style.marginTop = '15px';
	  errorDiv.style.textAlign = 'center';
	  errorDiv.style.padding = '10px';
	  errorDiv.style.backgroundColor = '#fff8f8';
	  errorDiv.style.borderRadius = '4px';
	  errorDiv.style.border = '1px solid #ffcccc';
	}

	// Function to display error message in popup
	function showErrorMessage(message) {
	  const errorDiv = document.createElement('div');
	  errorDiv.className = 'error-message';
	  errorDiv.textContent = message;

	  // Insert after the button
	  document.body.appendChild(errorDiv);

	  // Style the error message
	  errorDiv.style.color = 'red';
	  errorDiv.style.marginTop = '15px';
	  errorDiv.style.textAlign = 'center';
	  errorDiv.style.padding = '10px';
	  errorDiv.style.backgroundColor = '#fff8f8';
	  errorDiv.style.borderRadius = '4px';
	  errorDiv.style.border = '1px solid #ffcccc';
	}
      });
