# PostCard Backend Server

High-quality postcard image generation using Puppeteer (headless Chrome).

## 🚀 Features

- **Perfect Quality**: Renders HTML in headless Chrome for crystal-clear images
- **High Resolution**: 2x device scale factor for professional quality
- **Multiple Formats**: PNG and JPEG support
- **Customizable**: Configurable dimensions and quality settings

## 📦 Installation

```bash
npm install
```

## 🏃‍♂️ Running the Server

```bash
npm start
```

The server will run on `http://localhost:3001`

## 🔌 API Endpoints

### Generate Postcard Image

**POST** `/api/generate-postcard`

**Request Body:**
```json
{
  "htmlContent": "<html>...</html>",
  "width": 1024,
  "height": 1388,
  "format": "png",
  "quality": 100
}
```

**Response:** Image file (PNG or JPEG)

### Health Check

**GET** `/api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "Postcard backend is running"
}
```

## 🎯 How It Works

1. Receives HTML content from frontend
2. Opens a new headless Chrome page
3. Renders the HTML with perfect styling
4. Takes a high-resolution screenshot
5. Returns the image file

## 🔧 Configuration

- **Port**: 3001 (configurable in server.js)
- **Browser**: Headless Chrome with optimized settings
- **Quality**: 2x device scale factor for crisp images
- **CORS**: Enabled for frontend integration

## 🚨 Requirements

- Node.js 16+
- Chrome/Chromium (Puppeteer will download automatically)
- Sufficient memory for browser instances
