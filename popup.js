// Popup script for AI Image Processor extension

document.addEventListener("DOMContentLoaded", function () {
  loadStatistics();
  loadLatestDetectionResult();
});

// Load and display statistics from storage
function loadStatistics() {
  chrome.storage.local.get(
    ["processedImages", "lastProcessedImage"],
    function (result) {
      const processedCount = result.processedImages
        ? result.processedImages.length
        : 0;
      const lastProcessed = result.lastProcessedImage
        ? formatTimestamp(result.lastProcessedImage.timestamp)
        : "Never";

      document.getElementById("processedCount").textContent = processedCount;
      document.getElementById("lastProcessed").textContent = lastProcessed;
    }
  );
}

// Load and display the latest detection result
function loadLatestDetectionResult() {
  chrome.storage.local.get(["latestDetectionResult"], function (result) {
    if (result.latestDetectionResult && result.latestDetectionResult.success) {
      displayDetectionResult(result.latestDetectionResult);
    } else {
      // Hide the detection results section if no valid result
      const resultsContainer = document.getElementById("detectionResults");
      resultsContainer.style.display = "none";
    }
  });
}

// Display detection results in the popup
function displayDetectionResult(data) {
  const resultsContainer = document.getElementById("detectionResults");
  const predictionBadge = document.getElementById("predictionBadge");
  const predictionText = document.getElementById("predictionText");
  const confidenceFill = document.getElementById("confidenceFill");
  const confidenceText = document.getElementById("confidenceText");
  const humanProbability = document.getElementById("humanProbability");
  const aiProbability = document.getElementById("aiProbability");

  // Show the results container
  resultsContainer.style.display = "block";

  if (data.success) {
    const { results, prediction, confidence } = data;

    // Calculate percentages
    const humanPercent = Math.round(results.human * 100);
    const aiPercent = Math.round(results.artificial * 100);
    const confidencePercent = Math.round(confidence * 100);

    // Update prediction badge
    predictionBadge.className = "prediction-badge";
    if (prediction === "artificial") {
      predictionBadge.classList.add("ai-detected");
      predictionText.textContent = `${confidencePercent}% AI Generated`;
    } else {
      predictionBadge.classList.add("human-detected");
      predictionText.textContent = `Likely Not AI Generated (${confidencePercent}% confidence)`;
    }

    // Update confidence bar
    confidenceFill.className = "confidence-fill";
    if (prediction === "artificial" && confidence > 0.7) {
      confidenceFill.classList.add("ai-high");
    }
    confidenceFill.style.width = `${confidencePercent}%`;
    confidenceText.textContent = `${confidencePercent}%`;

    // Update detailed probabilities
    humanProbability.textContent = `${humanPercent}%`;
    aiProbability.textContent = `${aiPercent}%`;
  } else {
    // Handle error case
    predictionBadge.className = "prediction-badge analyzing";
    predictionText.textContent = "Analysis Failed";
    confidenceFill.style.width = "0%";
    confidenceText.textContent = "0%";
    humanProbability.textContent = "0%";
    aiProbability.textContent = "0%";
  }
}

// Format timestamp to readable date
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
}

// Listen for storage changes to update statistics in real-time
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (
    namespace === "local" &&
    (changes.processedImages || changes.lastProcessedImage)
  ) {
    loadStatistics();
  }

  // Listen for detection result changes
  if (namespace === "local" && changes.latestDetectionResult) {
    if (
      changes.latestDetectionResult.newValue &&
      changes.latestDetectionResult.newValue.success
    ) {
      displayDetectionResult(changes.latestDetectionResult.newValue);
    } else {
      // Hide the detection results section if no valid result
      const resultsContainer = document.getElementById("detectionResults");
      resultsContainer.style.display = "none";
    }
  }
});
