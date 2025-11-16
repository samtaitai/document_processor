# 📄 Smart Document Processor

> An AI-powered cloud-based document processing system that automatically extracts, analyzes, and provides intelligent insights from uploaded documents using Google Gemini AI.

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-0078D4?style=flat&logo=microsoft-azure)](https://azure.microsoft.com/en-us/services/functions/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat&logo=vue.js)](https://vuejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 What This Does

Transform any document (PDF, Word, Text) into AI-generated insights with just one click:

- **Upload** documents via drag-and-drop or click
- **AI Analysis** powered by Google Gemini - understands context and meaning
- **Intelligent Summaries** - AI generates concise 2-3 sentence overviews
- **Smart Keyword Extraction** - identifies key topics and themes using AI
- **Document Classification** - automatically categorizes document type and tone
- **Theme Analysis** - discovers main ideas and insights
- **Statistics** - word count, character count, estimated reading time

**Perfect for:** Content analysis, document summarization, research, compliance reviews, sentiment analysis, and intelligent data extraction.

---

## ✨ Key Features

### 🤖 **AI-Powered Intelligence**
- **Gemini AI Integration** - leverages Google's latest generative AI model
- **Contextual Understanding** - goes beyond word frequency to understand meaning
- **Intelligent Summarization** - generates human-like summaries
- **Theme Detection** - identifies main topics and insights
- **Document Categorization** - classifies by type (business report, novel, article, etc.)
- **Tone Analysis** - detects professional, casual, formal, technical writing styles

### 🚀 **Robust Processing**
- Supports PDF, DOCX, DOC, and TXT files
- Automatic text extraction using industry-standard libraries
- Asynchronous queue-based processing for reliability
- Real-time progress tracking

### 🔍 **Smart Analysis Output**
- AI-generated summary (context-aware, not just first 500 characters)
- Intelligent keyword extraction (semantic relevance, not just frequency)
- Main themes and insights
- Document type classification
- Sentiment/tone detection
- Full text access with statistics

### 🎨 **Modern User Experience**
- Clean, intuitive interface
- Drag-and-drop file upload
- Real-time status updates
- Responsive design (mobile and desktop)
- Beautiful animations and transitions

---

## 🏗️ Architecture

Built with modern serverless architecture and AI integration:
```
Browser ─► Azure Static Web Apps (frontend)
           └─► Azure API Management (gateway)
                └─► Azure Functions (backend)
                     ├─► Azure Blob Storage (file storage)
                     ├─► Azure Queue Storage (async processing)
                     └─► Google Gemini API (AI analysis)
```

### Why This Architecture?

- **Frontend** globally distributed via Azure Static Web Apps for fast delivery
- **API Management** provides security, rate limiting, and unified routing
- **Serverless Functions** handle document processing without managing servers
- **Queue-based Processing** ensures reliability and scalability
- **AI Integration** adds intelligent analysis without complex infrastructure
- **Blob Storage** efficiently manages uploaded and processed documents

---

## 🛠️ Technology Stack

### Frontend  
- Vue 3 — component-based UI framework  
- Vite — fast modern build tool  
- Azure Static Web Apps — hosting & global distribution  

### API Gateway  
- Azure API Management — unified gateway for API calls, securing and managing traffic  

### Backend Services  
- Azure Functions - serverless compute (Node.js)
- Azure Blob Storage - document storage
- Azure Queue Storage - asynchronous processing
- Google Gemini API - AI-powered document analysis

### Libraries
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX/DOC processing
- `@google/genai` - Google Gemini AI SDK 

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

### Planned Features
- 🔐 **User Authentication** - personal document libraries with Azure AD
- 📧 **Notifications** - email alerts when processing completes
- 💾 **Export Options** - download analysis as PDF, JSON, or CSV

### Advanced Capabilities
- 🤖 **Custom AI Prompts** - user-defined analysis parameters
- 📑 **Batch Processing** - analyze multiple files simultaneously
