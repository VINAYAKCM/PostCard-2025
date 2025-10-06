# PostCard - Digital Postcard Creator

A beautiful web app that lets users create and send digital postcards with personal messages, photos, and signatures.

## ✨ Features

- **Personal Setup**: Create profile with name, handle, and photo
- **Real-time Preview**: See your postcard as you type
- **Signature Drawing**: Draw signatures with mouse or touch
- **Photo Upload**: Attach images to postcards
- **Email Delivery**: Send postcards via email with downloadable images
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- EmailJS account

### Installation

1. Clone and install:
```bash
git clone <your-repo-url>
cd postcard-app
npm install
```

2. Configure EmailJS:
   - Create account at [EmailJS](https://www.emailjs.com/)
   - Set up email service and template
   - Update `src/config/emailConfig.ts` with your credentials

3. Run the app:
```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## 📧 EmailJS Setup

1. **Create Service**: Add Gmail/Outlook in EmailJS dashboard
2. **Create Template** with variables:
   - `{{to_email}}`, `{{to_name}}`, `{{from_handle}}`
   - `{{message}}`, `{{postcard_image}}`, `{{subject}}`
3. **Get Credentials**: Copy Service ID, Template ID, and Public Key
4. **Update Config**: Replace values in `src/config/emailConfig.ts`

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: CSS3
- **Canvas**: HTML5 for signatures
- **Email**: EmailJS
- **State**: React Context API

## 📁 Structure

```
postcard-app/
├── src/
│   ├── components/     # React components
│   ├── config/         # EmailJS configuration
│   ├── context/        # State management
│   └── App.tsx
├── public/             # Static assets
└── package.json
```

## 🎯 How It Works

1. **Setup**: Enter your details and upload profile photo
2. **Create**: Fill form with recipient info and message
3. **Personalize**: Draw signature and upload photos
4. **Send**: Email delivers postcard as downloadable image

---

**Built with ❤️ for digital communication**
