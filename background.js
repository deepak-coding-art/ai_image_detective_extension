// Background service worker for the AI Image Processor extension

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "processImage",
    title: "Process Image",
    contexts: ["image"],
    documentUrlPatterns: ["<all_urls>"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "processImage") {
    // Send message to content script to process the image
    chrome.tabs.sendMessage(tab.id, {
      action: "processImage",
      imageUrl: info.srcUrl,
      imageInfo: {
        src: info.srcUrl,
        alt: info.altText || "",
        title: info.title || "",
      },
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "imageProcessed") {
    console.log("Image processing completed:", request.result);

    // Save the processed image data
    const processedImage = {
      url: request.imageUrl,
      result: request.result,
      timestamp: Date.now(),
    };

    // Update last processed image
    chrome.storage.local.set({
      lastProcessedImage: processedImage,
    });

    // Add to processed images list
    chrome.storage.local.get(["processedImages"], function (result) {
      const processedImages = result.processedImages || [];
      processedImages.push(processedImage);

      // Keep only the last 50 processed images to avoid storage bloat
      if (processedImages.length > 50) {
        processedImages.splice(0, processedImages.length - 50);
      }

      chrome.storage.local.set({
        processedImages: processedImages,
      });
    });
  }
});
