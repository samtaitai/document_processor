# 📄 Smart Document Processor

> An intelligent cloud-based document processing system that automatically extracts, analyzes, and provides insights from uploaded documents in real-time.

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-0078D4?style=flat&logo=microsoft-azure)](https://azure.microsoft.com/en-us/services/functions/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat&logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 What This Does

Transform any document (PDF, Word, Text) into actionable insights with just one click:

- **Upload** documents via drag-and-drop or click
- **Automatic Processing** extracts text and analyzes content
- **Instant Insights** including word count, reading time, and key topics
- **Smart Search** finds important keywords automatically
- **History Tracking** keeps all your processed documents organized

**Perfect for:** Content analysis, document summarization, research, compliance reviews, and data extraction.

---

## ✨ Key Features

### 🚀 **Intelligent Processing**
- Supports PDF, DOCX, DOC, and TXT files
- Automatic text extraction using industry-standard libraries
- Real-time processing with progress tracking
- Extracts metadata: word count, character count, reading time

### 🔍 **Smart Analysis**
- **Keyword Extraction** - Identifies the 10 most important terms
- **Content Summary** - Generates quick overviews
- **Full Text Access** - Complete extracted content available
- **Statistical Insights** - Reading time estimation and content metrics

### 🎨 **Modern User Experience**
- Clean, intuitive interface
- Drag-and-drop file upload
- Real-time status updates
- Responsive design (works on mobile and desktop)
- Beautiful animations and transitions

---

## 🏗️ Architecture

Built with modern serverless architecture for scalability and reliability:

```
Browser ─► Azure Static Web Apps (frontend)
└─► /doc-processing ─► Azure API Management (gateway) ─► Backend services (Azure Functions, storage etc.)
```

### Why This Architecture?

- **Frontend** is globally distributed via Azure Static Web Apps — fast content delivery.  
- **API gateway** (Azure API Management) sits behind the `/doc-processing` route of the static app, providing unified routing, security, versioning and scale.  
- **Backend services** handle heavy lifting (document extraction, storage, queue processing, etc.), keeping frontend code simple and focused.  
- Seamless routing: the static web app automatically proxies `/api` calls to the linked backend (via API Management). No extra CORS hassles. 

---

## 🛠️ Technology Stack

### Frontend  
- Vue 3 — component-based UI framework  
- Vite — fast modern build tool  
- Azure Static Web Apps — hosting & global distribution  

### API Gateway  
- Azure API Management — unified gateway for API calls, securing and managing traffic  

### Backend Services  
- Azure Functions (or other serverless compute) — processing document uploads, queue triggers, result APIs  
- Azure Storage / Blob Storage — storing uploaded documents and processed results (if applicable)  
- (Optional) Azure Queue Storage or other messaging for asynchronous processing  

### CI / CD  
- GitHub Actions — automated build & deploy pipeline  
- `Azure/static-web-apps-deploy@v1` action for frontend + deploy  
- Environment variables managed via GitHub secrets + build time configuration  

---

## 🚀 Getting Started (Local Development)

### Prerequisites
```bash
Node.js 20.x
Azure Functions Core Tools v4
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd document-processor

# Install backend dependencies
cd functions
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally
```bash
# Terminal 1: Start local storage emulator
cd functions
npm run storage

# Terminal 2: Start Azure Functions
cd functions
npm start

# Terminal 3: Start frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## 📈 Potential Enhancements

### Short-term
- 🌐 Multi-language support (detect document language)
- 📊 Advanced analytics (sentiment analysis, entity extraction)
- 🔐 User authentication and private storage
- 📧 Email notifications when processing completes

### Long-term
- 🤖 AI-powered summarization using GPT models
- 📑 Batch processing for multiple files
- 🔗 API for third-party integrations
- 📱 Native mobile applications
- 🌍 Multi-region deployment for global users
