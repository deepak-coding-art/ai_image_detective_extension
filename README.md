# AI Image Processor Chrome Extension

A Chrome extension that adds a "Process Image" option to the right-click context menu on images. This extension analyzes images and provides detailed information about their properties, colors, and characteristics.

## Features

- **Auto-Detection**: Automatically detects and processes large images (200px+ width or height)
- **Visual Tags**: Shows 🔍 tags on processed images with hover tooltips
- **Context Menu Integration**: Right-click on any image to see a "Process Image" option
- **Image Analysis**: Analyzes image dimensions, colors, brightness, and characteristics
- **Real-time Processing**: Processes images directly in the browser using HTML5 Canvas
- **Beautiful UI**: Modern, responsive interface for displaying analysis results
- **Statistics Tracking**: Keeps track of processed images and usage statistics
- **Cross-origin Support**: Works with images from different domains (when CORS allows)

## What the Extension Analyzes

### Image Properties

- **Dimensions**: Width, height, and aspect ratio
- **File Information**: Alt text, title, and source URL

### Color Analysis

- **Average RGB Values**: Calculates the average red, green, and blue values
- **Dominant Color**: Determines the most prominent color in the image
- **Color Characteristics**: Identifies if the image is colorful or grayscale

### Image Characteristics

- **Brightness**: Calculates overall image brightness (0-255 scale)
- **Image Type**: Classifies images as dark, bright, grayscale, or color
- **Visual Properties**: Determines if the image is dark, colorful, etc.

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the folder containing this extension
5. **The extension should now appear** in your extensions list

### Method 2: Create Icon Files (Required for Production)

Before using the extension, you need to create actual PNG icon files:

1. Create three PNG files in the `icons/` directory:

   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. You can use any image editor (GIMP, Photoshop, or online tools) to create these icons

## Usage

### Auto-Detection Mode

1. **Navigate** to any webpage that contains images
2. **Wait** a few seconds for the extension to automatically detect large images (200px+)
3. **Look for 🔍 tags** appearing on processed images
4. **Hover over tags** to see quick analysis information
5. **Click tags** for detailed analysis results

### Manual Mode

1. **Right-click** on any image you want to analyze
2. **Select "Process Image"** from the context menu
3. **Wait** for the analysis to complete (you'll see a notification)
4. **View** the detailed analysis results in a modal window

### Statistics

- **Click** the extension icon in the toolbar to see usage statistics

## File Structure

```
ai_image_detector_extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for image processing
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### Manifest Version 3

This extension uses Chrome's Manifest V3, which is the current standard for Chrome extensions.

### Permissions Used

- `contextMenus`: To create the right-click menu option
- `activeTab`: To interact with the current tab
- `storage`: To save processing statistics

### Image Processing

The extension uses HTML5 Canvas API to analyze images:

- Loads images into a canvas element
- Extracts pixel data for analysis
- Performs color and brightness calculations
- Determines image characteristics

### Auto-Detection Configuration

The extension automatically detects and processes images that meet the following criteria:

- **Minimum size**: 150px width or height (configurable in `content.js`)
- **Valid URL**: Must have a valid HTTP/HTTPS URL (not data URLs)
- **Not already processed**: Avoids duplicate processing

### Cross-Origin Considerations

The extension handles cross-origin images by setting `crossOrigin = "anonymous"` on image elements. However, some images may not be accessible due to CORS policies.

## Customization

### Customizing Auto-Detection

You can modify the auto-detection behavior by editing the `CONFIG` object in `content.js`:

```javascript
const CONFIG = {
  minImageSize: 150, // Change minimum size for auto-detection
  tagSize: 24, // Change tag size
  tagColor: "#667eea", // Change tag color
  tagHoverColor: "#764ba2", // Change hover color
  // ... other options
};
```

### Adding New Analysis Features

You can extend the `analyzeImage()` function in `content.js` to add new analysis capabilities:

```javascript
function analyzeImage(imageData, imageInfo) {
  // Existing analysis code...

  // Add your custom analysis here
  const customAnalysis = performCustomAnalysis(imageData);

  return {
    // Existing properties...
    custom: customAnalysis,
  };
}
```

### Modifying the UI

The analysis results are displayed in `showImageAnalysisResults()` function in `content.js`. You can modify the HTML template to change the appearance and layout.

### Styling Changes

The popup styling is in `popup.html` and the modal styling is in `content.js`. Modify the CSS to change the appearance.

## Troubleshooting

### Extension Not Loading

- Make sure all files are in the correct directory structure
- Check that `manifest.json` is valid JSON
- Ensure you have actual PNG icon files (not placeholder text files)

### Context Menu Not Appearing

- Refresh the webpage after installing the extension
- Check the browser console for any JavaScript errors
- Ensure the extension has the necessary permissions

### Image Processing Fails

- Some images may be blocked by CORS policies
- Very large images may take longer to process
- Check the browser console for error messages

### Performance Issues

- The extension processes images in the main thread
- Large images may cause temporary UI freezing
- Consider implementing Web Workers for better performance

## Browser Compatibility

This extension is designed for Chrome and other Chromium-based browsers (Edge, Brave, etc.) that support Manifest V3.

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension.

## Future Enhancements

Potential improvements for future versions:

- Integration with AI services for advanced image analysis
- Batch processing of multiple images
- Export analysis results to various formats
- Custom analysis filters and options
- Performance optimizations using Web Workers
- Support for video frame analysis
