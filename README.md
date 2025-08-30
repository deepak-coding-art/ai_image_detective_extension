# AI Image Detective – Chrome Extension

A lightweight Chrome extension that connects to your API to detect whether images are **AI-generated** or **human-made**. The extension overlays results directly on webpages with confidence scores and detailed probability breakdowns.

---

## 🔍 Features

- Automatic AI detection on page load
- Real-time analysis with prediction badge
- Confidence bar with percentage indicators
- Visual tags on images: 🤖 (AI) or 👤 (Human)
- Clickable tags for detailed results
- Right-click any image → _Process Image_
- Works seamlessly on any website

---

## 📊 Detection Results UI

- **Prediction Badge**: Shows live status/result
- **Confidence Bar**: Displays detection confidence
- **Detailed Breakdown**:
  - Human Probability (%)
  - AI Generated Probability (%)

---

## 🚀 How to Use

1. Clone or download this repo.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.
5. Navigate to any webpage with images:
   - Images are analyzed automatically.
   - Colored tags appear on images.
   - Click a tag to view details or right-click → _Process Image_.

---

## 🛠️ Development

- Extension code connects directly to your backend API for detection.
- UI is dynamically injected into webpages for a smooth experience.
- Results update in real time as API responses are received.

---

## 📄 License

MIT License – feel free to use and adapt.
