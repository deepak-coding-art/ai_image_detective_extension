# AI Image Detective Extension

A Chrome extension that detects AI-generated images on web pages with manual processing control and real-time progress tracking.

## Features

- **Manual Image Processing**: Control when to process images instead of automatic processing
- **Image Count Display**: Shows the total number of images found on the current page
- **Batch Processing**: Process all images one by one with a single click
- **Progress Tracking**: Real-time progress indicator showing "X/Y processed"
- **Individual Analysis**: Click on individual image tags to analyze specific images
- **Visual Indicators**: Color-coded tags (🔍=unprocessed, 🤖=AI, 👤=Human)
- **Detailed Results**: Click on processed tags to view comprehensive analysis
- **Context Menu Integration**: Right-click any image to process it manually

## How to Use

1. **Install the Extension**

   - Load the extension in Chrome Developer Mode
   - Navigate to any webpage with images

2. **View Image Count**

   - Click the extension icon in your browser toolbar
   - See how many images are found on the current page
   - The "Process All Images" button appears if images are found

3. **Process Images**

   - **Option 1**: Click "Process All Images" to analyze all images one by one
   - **Option 2**: Click individual 🔍 tags on images to analyze them individually
   - **Option 3**: Right-click any image → "Process Image" for manual analysis

4. **Monitor Progress**

   - Watch the progress indicator: "1/6 processed", "2/6 processed", etc.
   - Progress bar shows visual completion status
   - Button is disabled during processing

5. **View Results**
   - Tags change color and icon after processing:
     - 🤖 Red/Orange = AI Generated
     - 👤 Green = Likely Human
   - Click on processed tags to view detailed analysis results
   - Hover over tags for quick information

## Technical Details

### Image Detection

- Automatically detects images larger than 150px (width or height)
- Adds clickable 🔍 tags to all detected images
- Works with dynamically loaded content

### Processing Flow

1. **Manual Trigger**: User clicks "Process All Images" or individual tags
2. **Sequential Processing**: Images are processed one by one to avoid API overload
3. **Progress Updates**: Real-time progress sent to popup
4. **Visual Feedback**: Tags update with processing status and results
5. **Storage**: Results are stored locally for future reference

### API Integration

- Connects to local AI detection service at `http://localhost:3009/api/detect`
- Sends image data as FormData with JPEG compression
- Handles API errors gracefully with user feedback

## File Structure

```
ai_image_detector_extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality and progress tracking
├── content.js             # Content script for image detection and processing
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── test.html              # Test page with multiple images
└── README.md              # This file
```

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## Testing

1. Open `test.html` in your browser
2. Click the extension icon to see image count
3. Click "Process All Images" to test batch processing
4. Click individual 🔍 tags to test individual processing
5. Verify progress tracking and result display

## Requirements

- Chrome browser with extension support
- Local AI detection service running on `http://localhost:3009`
- Images must be accessible (not blocked by CORS)

## Troubleshooting

- **No images detected**: Check if images are larger than 150px
- **Processing fails**: Ensure AI detection service is running
- **Tags not appearing**: Refresh the page and wait for images to load
- **Progress not updating**: Check browser console for errors

## Development

To modify the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Test changes on a webpage

## License

This project is open source and available under the MIT License.
