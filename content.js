// Content script for AI Image Processor extension

// Configuration for auto-detection
const CONFIG = {
  minImageSize: 150, // Minimum width/height to consider as "big image"
  tagSize: 24, // Size of the tag in pixels
  tagColor: "#667eea",
  tagHoverColor: "#764ba2",
  tagTextColor: "#ffffff",
  tagFontSize: "12px",
  tagFontFamily: "Arial, sans-serif",
};

// Store processed images data
const processedImages = new Map();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processImage") {
    processImage(request.imageUrl, request.imageInfo);
  }
});

// Auto-detect and process large images when page loads
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(autoDetectAndProcessImages, 1000); // Wait for images to load
});

// Also detect images that load dynamically
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          let images = [];

          // If the node has querySelectorAll, use it to find images
          if (node.querySelectorAll) {
            images = Array.from(node.querySelectorAll("img"));
          }

          // If the node itself is an img element, add it to the array
          if (node.tagName === "IMG") {
            images.push(node);
          }

          images.forEach((img) => {
            if (isLargeImage(img)) {
              setTimeout(() => processImageIfNotProcessed(img), 500);
            }
          });
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Function to auto-detect and process large images
function autoDetectAndProcessImages() {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    if (isLargeImage(img)) {
      processImageIfNotProcessed(img);
    }
  });
}

// Check if image is considered "large"
function isLargeImage(img) {
  const rect = img.getBoundingClientRect();
  return (
    rect.width >= CONFIG.minImageSize || rect.height >= CONFIG.minImageSize
  );
}

// Process image if not already processed
function processImageIfNotProcessed(img) {
  const imageUrl = img.src;
  if (
    !processedImages.has(imageUrl) &&
    imageUrl &&
    !imageUrl.startsWith("data:")
  ) {
    const imageInfo = {
      src: imageUrl,
      alt: img.alt || "",
      title: img.title || "",
    };

    // Add a temporary tag while processing
    addProcessingTag(img);

    processImage(imageUrl, imageInfo, img);
  }
}

// Function to process the image
async function processImage(imageUrl, imageInfo, imgElement = null) {
  try {
    // Show processing notification only for manual processing
    if (!imgElement) {
      showNotification("Processing image...", "info");
    }

    // Create a canvas to analyze the image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = async function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Perform basic image analysis
      const analysis = analyzeImage(imageData, imageInfo);

      // Perform AI detection automatically
      try {
        const aiDetectionResult = await performAIDetection(canvas);
        analysis.aiDetection = aiDetectionResult;

        // Store the AI detection result in chrome.storage.local
        chrome.storage.local.set({
          latestDetectionResult: aiDetectionResult,
        });
      } catch (error) {
        console.error("AI detection failed:", error);
        analysis.aiDetection = { success: false, error: error.message };
      }

      // Store the analysis result
      processedImages.set(imageUrl, analysis);

      // If this was auto-detected, add a tag to the image
      if (imgElement) {
        addImageTag(imgElement, analysis, canvas);
      } else {
        // Display results for manual processing
        showImageAnalysisResults(analysis, imageUrl);
      }

      // Send result back to background script
      chrome.runtime.sendMessage({
        action: "imageProcessed",
        imageUrl: imageUrl,
        result: analysis,
      });
    };

    img.onerror = function () {
      if (imgElement) {
        removeImageTag(imgElement);
      } else {
        showNotification("Failed to load image for processing", "error");
      }
    };

    img.src = imageUrl;
  } catch (error) {
    console.error("Error processing image:", error);
    if (imgElement) {
      removeImageTag(imgElement);
    } else {
      showNotification("Error processing image", "error");
    }
  }
}

// Function to analyze image data
function analyzeImage(imageData, imageInfo) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let totalPixels = width * height;
  let redSum = 0,
    greenSum = 0,
    blueSum = 0;
  let brightnessSum = 0;
  let contrastSum = 0;

  // Calculate average colors and brightness
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    redSum += r;
    greenSum += g;
    blueSum += b;

    // Calculate brightness (0.299*R + 0.587*G + 0.114*B)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += brightness;
  }

  const avgRed = Math.round(redSum / totalPixels);
  const avgGreen = Math.round(greenSum / totalPixels);
  const avgBlue = Math.round(blueSum / totalPixels);
  const avgBrightness = Math.round(brightnessSum / totalPixels);

  // Determine image characteristics
  const isDark = avgBrightness < 128;
  const isColorful =
    Math.max(avgRed, avgGreen, avgBlue) - Math.min(avgRed, avgGreen, avgBlue) >
    50;

  return {
    dimensions: {
      width: width,
      height: height,
      aspectRatio: (width / height).toFixed(2),
    },
    colors: {
      averageRed: avgRed,
      averageGreen: avgGreen,
      averageBlue: avgBlue,
      dominantColor: getDominantColor(avgRed, avgGreen, avgBlue),
    },
    characteristics: {
      brightness: avgBrightness,
      isDark: isDark,
      isColorful: isColorful,
      estimatedType: estimateImageType(
        avgRed,
        avgGreen,
        avgBlue,
        avgBrightness
      ),
    },
    metadata: {
      alt: imageInfo.alt,
      title: imageInfo.title,
      url: imageInfo.src,
    },
  };
}

// Helper function to determine dominant color
function getDominantColor(r, g, b) {
  if (r > g && r > b) return "Red";
  if (g > r && g > b) return "Green";
  if (b > r && b > g) return "Blue";
  return "Balanced";
}

// Helper function to estimate image type
function estimateImageType(r, g, b, brightness) {
  if (brightness < 50) return "Dark/Low-light";
  if (brightness > 200) return "Bright/Overexposed";
  if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10) return "Grayscale";
  return "Color";
}

// Function to show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease;
  `;

  if (type === "error") {
    notification.style.backgroundColor = "#e74c3c";
  } else if (type === "success") {
    notification.style.backgroundColor = "#27ae60";
  } else {
    notification.style.backgroundColor = "#3498db";
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Function to show image analysis results
function showImageAnalysisResults(analysis, imageUrl) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    font-family: Arial, sans-serif;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `;

  // Generate AI detection results HTML
  let aiDetectionHTML = "";
  if (analysis.aiDetection && analysis.aiDetection.success) {
    const { results, prediction, confidence } = analysis.aiDetection;
    const humanPercent = Math.round(results.human * 100);
    const aiPercent = Math.round(results.artificial * 100);
    const confidencePercent = Math.round(confidence * 100);

    const predictionColor = prediction === "artificial" ? "#e74c3c" : "#27ae60";
    const predictionText =
      prediction === "artificial"
        ? `${confidencePercent}% AI Generated`
        : `Likely Not AI Generated (${confidencePercent}% confidence)`;

    aiDetectionHTML = `
      <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; background: ${predictionColor}15; border-left: 4px solid ${predictionColor};">
        <h3 style="margin: 0 0 12px 0; color: #333;">AI Detection Results</h3>
        <div style="margin-bottom: 12px;">
          <div style="padding: 8px 16px; background: ${predictionColor}; color: white; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px;">
            ${predictionText}
          </div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #666;">Human Probability:</span>
            <span style="font-weight: 600; color: #333;">${humanPercent}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">AI Generated Probability:</span>
            <span style="font-weight: 600; color: #333;">${aiPercent}%</span>
          </div>
        </div>
      </div>
    `;
  } else if (analysis.aiDetection && !analysis.aiDetection.success) {
    aiDetectionHTML = `
      <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; background: #f39c1215; border-left: 4px solid #f39c12;">
        <h3 style="margin: 0 0 8px 0; color: #333;">AI Detection Results</h3>
        <p style="margin: 0; color: #e67e22;">Analysis failed: ${
          analysis.aiDetection.error || "Unknown error"
        }</p>
      </div>
    `;
  } else {
    aiDetectionHTML = `
      <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; background: #3498db15; border-left: 4px solid #3498db;">
        <h3 style="margin: 0 0 12px 0; color: #333;">AI Detection</h3>
        <p style="margin: 0; color: #2980b9;">Click the 🔍 tag on the image to perform AI analysis</p>
      </div>
    `;
  }

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #333;">AI Image Analysis</h2>
      <button id="closeModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
    </div>
    
    <div style="margin-bottom: 20px;">
      <img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Analyzed image">
    </div>
    
    ${aiDetectionHTML}
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Close modal functionality
  document.getElementById("closeModal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  showNotification("Image analysis completed!", "success");
}

// Function to add a processing tag to an image
function addProcessingTag(imgElement) {
  const tag = document.createElement("div");
  tag.className = "ai-image-processor-tag processing";
  tag.innerHTML = "⏳";
  tag.title = "Processing image...";

  tag.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    width: ${CONFIG.tagSize}px;
    height: ${CONFIG.tagSize}px;
    background-color: #f39c12;
    color: ${CONFIG.tagTextColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    z-index: 1000;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;

  // Make the image container relative positioned if it's not already
  const container = imgElement.parentElement;
  if (container && getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  // If no container or container is body, make image relative
  if (!container || container === document.body) {
    imgElement.style.position = "relative";
  }

  const targetElement =
    container && container !== document.body ? container : imgElement;
  targetElement.appendChild(tag);

  // Store reference to tag
  imgElement.aiProcessorTag = tag;
}

// Function to add a processed image tag
function addImageTag(imgElement, analysis, canvas) {
  // Remove processing tag if exists
  removeImageTag(imgElement);

  const tag = document.createElement("div");
  tag.className = "ai-image-processor-tag processed";

  tag.style.cssText = `
     position: absolute;
     top: 8px;
     right: 8px;
     width: ${CONFIG.tagSize}px;
     height: ${CONFIG.tagSize}px;
     background-color: ${CONFIG.tagColor};
     color: ${CONFIG.tagTextColor};
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
     font-size: 14px;
     font-weight: bold;
     z-index: 1000;
     cursor: pointer;
     box-shadow: 0 2px 8px rgba(0,0,0,0.3);
     transition: all 0.3s ease;
   `;

  // Update tag appearance based on AI detection results if available
  if (analysis.aiDetection && analysis.aiDetection.success) {
    updateTagAppearance(tag, analysis.aiDetection);
  } else {
    // Show loading state while AI detection is in progress
    tag.innerHTML = "⏳";
    tag.title = "Analyzing with AI...";
    tag.style.backgroundColor = "#f39c12";
  }

  // Add hover effect
  tag.addEventListener("mouseenter", () => {
    tag.style.backgroundColor = CONFIG.tagHoverColor;
    tag.style.transform = "scale(1.1)";
    showHoverTooltip(tag, analysis);
  });

  tag.addEventListener("mouseleave", () => {
    // Reset to the appropriate color based on AI detection results
    if (analysis.aiDetection && analysis.aiDetection.success) {
      const { prediction, confidence } = analysis.aiDetection;
      if (prediction === "artificial" && confidence > 0.7) {
        tag.style.backgroundColor = "#e74c3c";
      } else if (prediction === "artificial") {
        tag.style.backgroundColor = "#f39c12";
      } else {
        tag.style.backgroundColor = "#27ae60";
      }
    } else {
      tag.style.backgroundColor = CONFIG.tagColor;
    }
    tag.style.transform = "scale(1)";
    hideHoverTooltip();
  });

  // Add click event to show detailed results
  tag.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Show detailed results
    showImageAnalysisResults(analysis, imgElement.src);
  });

  // Make the image container relative positioned if it's not already
  const container = imgElement.parentElement;
  if (container && getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  // If no container or container is body, make image relative
  if (!container || container === document.body) {
    imgElement.style.position = "relative";
  }

  const targetElement =
    container && container !== document.body ? container : imgElement;
  targetElement.appendChild(tag);

  // Store reference to tag
  imgElement.aiProcessorTag = tag;
}

// Function to remove image tag
function removeImageTag(imgElement) {
  if (imgElement.aiProcessorTag) {
    imgElement.aiProcessorTag.remove();
    imgElement.aiProcessorTag = null;
  }
}

// Function to show hover tooltip
function showHoverTooltip(tag, analysis) {
  const tooltip = document.createElement("div");
  tooltip.className = "ai-image-processor-tooltip";

  // Generate AI detection info for tooltip
  let aiInfo = "";
  if (analysis.aiDetection && analysis.aiDetection.success) {
    const { results, prediction, confidence } = analysis.aiDetection;
    const aiPercent = Math.round(results.artificial * 100);
    const confidencePercent = Math.round(confidence * 100);

    if (prediction === "artificial") {
      aiInfo = `<div style="color: #e74c3c; font-weight: bold;">AI: ${aiPercent}% confidence</div>`;
    } else {
      aiInfo = `<div style="color: #27ae60; font-weight: bold;">Human: ${Math.round(
        results.human * 100
      )}% confidence</div>`;
    }
  } else if (analysis.aiDetection && !analysis.aiDetection.success) {
    aiInfo = `<div style="color: #f39c12;">AI Analysis Failed</div>`;
  } else {
    aiInfo = ``;
  }

  tooltip.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">AI Image Analysis</div>
    ${aiInfo}
  `;

  tooltip.style.cssText = `
    position: absolute;
    top: ${CONFIG.tagSize + 8}px;
    right: 0px;
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-family: ${CONFIG.tagFontFamily};
    white-space: nowrap;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: none;
    max-width: 200px;
  `;

  tag.appendChild(tooltip);
  tag.aiProcessorTooltip = tooltip;
}

// Function to hide hover tooltip
function hideHoverTooltip() {
  const tooltips = document.querySelectorAll(".ai-image-processor-tooltip");
  tooltips.forEach((tooltip) => tooltip.remove());
}

// Function to update tag appearance based on AI detection results
function updateTagAppearance(tag, aiDetectionResult) {
  if (aiDetectionResult.success) {
    const { prediction, confidence } = aiDetectionResult;
    const confidencePercent = Math.round(confidence * 100);

    if (prediction === "artificial" && confidence > 0.7) {
      tag.style.backgroundColor = "#e74c3c"; // Red for high confidence AI
      tag.innerHTML = "🤖";
      tag.title = `${confidencePercent}% AI Generated - Click for details`;
    } else if (prediction === "artificial") {
      tag.style.backgroundColor = "#f39c12"; // Orange for medium confidence AI
      tag.innerHTML = "🤖";
      tag.title = `${confidencePercent}% AI Generated - Click for details`;
    } else {
      tag.style.backgroundColor = "#27ae60"; // Green for human
      tag.innerHTML = "👤";
      tag.title = `Likely Human (${confidencePercent}% confidence) - Click for details`;
    }
  } else {
    // Reset to default state if AI detection failed
    tag.innerHTML = "🔍";
    tag.title = "AI analysis failed - Click to retry";
    tag.style.backgroundColor = CONFIG.tagColor;
  }
}

// Function to perform AI detection using the API
async function performAIDetection(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        try {
          const formData = new FormData();
          formData.append("file", blob, "image.jpg");

          const response = await fetch(
            "https://detective.builddev.in/api/detect",
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to analyze image");
          }

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      "image/jpeg",
      0.9
    );
  });
}
