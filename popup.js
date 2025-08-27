// Popup script for AI Image Processor extension

document.addEventListener("DOMContentLoaded", function () {
  loadPageStatistics();
  loadPageImageCount();
  setupProcessButton();
  setupAutoProcessToggle();
});

// Setup auto-process toggle functionality
function setupAutoProcessToggle() {
  const autoProcessToggle = document.getElementById("autoProcessToggle");

  // Load saved setting
  chrome.storage.local.get(["autoProcessEnabled"], function (result) {
    autoProcessToggle.checked = result.autoProcessEnabled || false;
  });

  // Handle toggle change
  autoProcessToggle.addEventListener("change", function () {
    const isEnabled = autoProcessToggle.checked;

    // Save setting
    chrome.storage.local.set({ autoProcessEnabled: isEnabled });

    // Send message to content script to update auto-process setting
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: "updateAutoProcessSetting",
          enabled: isEnabled,
        });
      }
    });
  });
}

// Load and display current page statistics
function loadPageStatistics() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    if (activeTab) {
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "getPageStatistics" },
        function (response) {
          if (chrome.runtime.lastError) {
            // Content script not loaded or error
            document.getElementById("processedCount").textContent = "0";
            document.getElementById("lastProcessed").textContent = "Never";
            return;
          }

          const stats = response || {
            processedCount: 0,
            lastProcessed: "Never",
          };
          document.getElementById("processedCount").textContent =
            stats.processedCount;
          document.getElementById("lastProcessed").textContent =
            stats.lastProcessed;
        }
      );
    }
  });
}

// Load page image count from content script
function loadPageImageCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    if (activeTab) {
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "getImageCount" },
        function (response) {
          if (chrome.runtime.lastError) {
            // Content script not loaded or error
            document.getElementById("imagesFound").textContent = "0";
            document.getElementById("processSection").style.display = "none";
            return;
          }

          const imageCount = response ? response.count : 0;
          document.getElementById("imagesFound").textContent = imageCount;

          // Show/hide process section based on image count
          const processSection = document.getElementById("processSection");
          if (imageCount > 0) {
            processSection.style.display = "block";
          } else {
            processSection.style.display = "none";
          }
        }
      );
    }
  });
}

// Setup process button functionality
function setupProcessButton() {
  const processButton = document.getElementById("processButton");
  const stopResetButton = document.getElementById("stopResetButton");
  const circularProgress = document.getElementById("circularProgress");
  const progressText = document.getElementById("progressText");
  const progressLabel = document.getElementById("progressLabel");
  const progressFill = document.querySelector(".progress-fill");
  const resultsCharts = document.getElementById("resultsCharts");

  // Calculate circumference for circular progress
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  // Initialize progress fill
  progressFill.style.strokeDasharray = "0 " + circumference;

  processButton.addEventListener("click", function () {
    // Disable button and show circular progress
    processButton.disabled = true;
    processButton.textContent = "Processing...";

    // Show circular progress and hide charts
    circularProgress.style.display = "block";
    resultsCharts.style.display = "none";

    // Show stop button
    stopResetButton.style.display = "block";
    stopResetButton.textContent = "Stop Processing";
    stopResetButton.className = "stop-reset-button";

    // Reset progress
    progressFill.style.strokeDasharray = "0 " + circumference;
    progressText.textContent = "0/0";
    progressLabel.textContent = "Processing images...";

    // Send message to content script to start processing
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "processAllImages" },
          function (response) {
            if (chrome.runtime.lastError) {
              // Handle error
              // resetProcessButton();
              return;
            }

            if (response && response.success) {
              // Progress updates will be handled by the global message listener below
            } else {
              resetProcessButton();
            }
          }
        );
      }
    });
  });

  // Setup stop/reset button functionality
  stopResetButton.addEventListener("click", function () {
    if (stopResetButton.textContent === "Stop Processing") {
      // Stop processing
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        if (activeTab) {
          chrome.tabs.sendMessage(activeTab.id, { action: "stopProcessing" });

          // Change to reset button
          stopResetButton.textContent = "Reset";
          stopResetButton.className = "stop-reset-button reset";

          // Re-enable process button
          processButton.disabled = false;
          processButton.textContent = "Process All Images";

          // Hide circular progress
          circularProgress.style.display = "none";
        }
      });
    } else if (stopResetButton.textContent === "Reset") {
      // Reset everything
      resetProcessButton();
    }
  });
}

// Function to reset process button and hide all progress elements
function resetProcessButton() {
  const processButton = document.getElementById("processButton");
  const stopResetButton = document.getElementById("stopResetButton");
  const circularProgress = document.getElementById("circularProgress");
  const resultsCharts = document.getElementById("resultsCharts");

  // Reset process button
  processButton.style.display = "block";
  processButton.disabled = false;
  processButton.textContent = "Process All Images";

  // Hide stop/reset button
  stopResetButton.style.display = "none";

  // Hide progress elements
  circularProgress.style.display = "none";
  resultsCharts.style.display = "none";
}

// Function to update circular progress
function updateCircularProgress(current, total) {
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.getElementById("progressText");
  const progressLabel = document.getElementById("progressLabel");
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  if (total > 0) {
    const percentage = Math.min(current / total, 1);
    const progress = percentage * circumference;

    // Update the stroke dasharray smoothly
    progressFill.style.strokeDasharray = progress + " " + circumference;
    progressText.textContent = `${current}/${total}`;

    if (current >= total) {
      progressLabel.textContent = "Processing complete!";

      // Change to reset button when processing is complete
      const stopResetButton = document.getElementById("stopResetButton");
      const processButton = document.getElementById("processButton");

      stopResetButton.textContent = "Reset";
      stopResetButton.className = "stop-reset-button reset";

      // Re-enable process button
      processButton.disabled = false;
      processButton.textContent = "Process All Images";
    } else {
      progressLabel.textContent = "Processing images...";
    }
  }
}

// Function to update bar charts
function updateBarCharts(humanCount, aiCount, totalProcessed) {
  const humanChart = document.getElementById("humanChart");
  const aiChart = document.getElementById("aiChart");
  const humanValue = document.getElementById("humanValue");
  const aiValue = document.getElementById("aiValue");
  const resultsCharts = document.getElementById("resultsCharts");

  if (totalProcessed > 0) {
    const humanPercentage = (humanCount / totalProcessed) * 100;
    const aiPercentage = (aiCount / totalProcessed) * 100;

    humanChart.style.width = humanPercentage + "%";
    aiChart.style.width = aiPercentage + "%";

    humanValue.textContent = humanCount;
    aiValue.textContent = aiCount;

    // Show charts after processing starts
    resultsCharts.style.display = "block";
  }
}

// Store these functions globally for the message listener
window.updateCircularProgress = updateCircularProgress;
window.updateBarCharts = updateBarCharts;
window.resetProcessButton = resetProcessButton;

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
  if (namespace === "local" && changes.pageStatistics) {
    loadPageStatistics();
  }
});

// Listen for progress updates from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "processingProgress") {
    const { current, total } = request;

    // Update circular progress
    if (window.updateCircularProgress) {
      window.updateCircularProgress(current, total);
    }

    if (current >= total) {
      // Processing complete - keep progress visible for a moment
      processButton.style.display = "none";
    }
  } else if (request.action === "detectionSummary") {
    // Update bar charts with detection results
    const { aiCount, humanCount, totalProcessed } = request.data;

    if (window.updateBarCharts) {
      window.updateBarCharts(humanCount, aiCount, totalProcessed);
    }
  }
});
