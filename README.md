# ChatGPT Chat Saver

A Chrome extension that allows you to save and organize your ChatGPT conversations with custom labels.

## Features

- Save ChatGPT conversations directly from the chat interface
- Organize conversations with custom labels
- Easy access to saved conversations through the extension popup
- Works with both chat.openai.com and chatgpt.com domains

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Visit ChatGPT (chat.openai.com or chatgpt.com)
2. Click the extension icon in your Chrome toolbar
3. Use the popup interface to:
   - Save current conversations
   - Add labels to your saved conversations
   - View and manage your saved conversations

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Implements content scripts for ChatGPT interface integration
- Stores data using Chrome's storage API

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html` & `popup.js` - Extension popup interface
- `content.js` - Main content script for ChatGPT integration
- `inject.js` - Injected scripts for ChatGPT page
- `background.js` - Background service worker
- `styles.css` - Extension styling
- `icons/` - Extension icons in various sizes

## Permissions

The extension requires the following permissions:
- `storage` - For saving conversations
- `activeTab` - For accessing the current tab
- `scripting` - For injecting scripts into ChatGPT pages

## Development

To modify or enhance the extension:

1. Make your changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test your changes on ChatGPT

## Version

Current version: 1.2.0

## License

[Add your chosen license here]

## Contributing

[Add contribution guidelines if you want to accept contributions]
