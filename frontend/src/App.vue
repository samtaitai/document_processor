<script>
import "./App.css";

export default {
  name: "App",
  data() {
    return {
      selectedFile: null,
      uploading: false,
      uploadStatus: null,
      currentDocId: null,
      processingResult: null,
      checkInterval: null,
      apiBaseUrl: "http://localhost:7071/api",
      uploadHistory: [], // Store upload history
      checkStartTime: null,
      maxPollingTime: 30000,
      searchQuery: "",
    };
  },
  mounted() {
    // Load history from localStorage on mount
    // localStorage is a built-in browser API for storing data on the user's computer
    const savedHistory = localStorage.getItem("uploadHistory");
    if (savedHistory) {
      this.uploadHistory = JSON.parse(savedHistory);
    }
  },
  computed: {
    filteredHistory() {
      if (!this.searchQuery.trim()) {
        return this.uploadHistory;
      }
      const query = this.searchQuery.toLowerCase();
      return this.uploadHistory.filter((item) =>
        item.fileName.toLowerCase().includes(query)
      );
    },
  },
  methods: {
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.uploadStatus = null;
        this.processingResult = null;
      }
    },

    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        this.selectedFile = file;
        this.uploadStatus = null;
        this.processingResult = null;
      }
    },

    async uploadFile() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.uploadStatus = {
        type: "info",
        icon: "⏳",
        message: "Uploading file...",
      };

      try {
        const formData = new FormData();
        formData.append("file", this.selectedFile);

        const response = await fetch(`${this.apiBaseUrl}/UploadHandler`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          this.currentDocId = data.docId;

          // Add to history
          const historyItem = {
            docId: data.docId,
            fileName: data.fileName,
            fileSize: data.fileSize,
            uploadedAt: new Date().toISOString(),
            status: "processing",
          };
          this.uploadHistory.unshift(historyItem); // Add to beginning
          this.saveHistory();

          this.uploadStatus = {
            type: "success",
            icon: "✅",
            message: "File uploaded! Processing...",
          };

          // Start checking for results
          this.startChecking();
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        this.uploadStatus = {
          type: "error",
          icon: "❌",
          message: `Upload failed: ${error.message}`,
        };
      } finally {
        this.uploading = false;
      }
    },

    startChecking() {
      this.checkStartTime = Date.now();
      this.checkResults();

      // Then check every 2 seconds
      this.checkInterval = setInterval(() => {
        this.checkResults();
      }, 2000);
    },

    async checkResults() {
      const elapsedTime = Date.now() - this.checkStartTime;
      if (elapsedTime > this.maxPollingTime) {
        this.uploadStatus = {
          type: "error",
          icon: "⏱️",
          message: "Processing timed out. Please try again later.",
        };

        // Update history status to error
        const historyItem = this.uploadHistory.find(
          (item) => item.docId === this.currentDocId
        );
        if (historyItem) {
          historyItem.status = "error";
          this.saveHistory();
        }

        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        return;
      }
      if (!this.currentDocId) return;

      try {
        const response = await fetch(
          `${this.apiBaseUrl}/ResultsAPI?docId=${this.currentDocId}`
        );
        const data = await response.json();

        if (data.status === "completed") {
          // Processing complete!
          this.processingResult = data;
          this.uploadStatus = {
            type: "success",
            icon: "🎉",
            message: "Processing complete!",
          };

          // Update history status
          const historyItem = this.uploadHistory.find(
            (item) => item.docId === this.currentDocId
          );
          if (historyItem) {
            historyItem.status = "completed";
            this.saveHistory();
          }

          // Stop checking
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
        } else if (data.status === "not_found") {
          throw new Error("Document not found");
        }
        // If status is 'processing', keep waiting
      } catch (error) {
        console.error("Check results error:", error);
        this.uploadStatus = {
          type: "error",
          icon: "❌",
          message: `Error: ${error.message}`,
        };

        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      }
    },

    async viewResults(docId) {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/ResultsAPI?docId=${docId}`
        );
        const data = await response.json();

        if (data.status === "completed") {
          this.processingResult = data;
          this.currentDocId = docId;
          // Scroll to results
          setTimeout(() => {
            document.querySelector(".results-section")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        } else if (data.status === "processing") {
          alert("Document is still being processed. Please wait a moment.");
        } else {
          alert("Document not found or processing failed.");
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        alert("Failed to load results: " + error.message);
      }
    },

    async downloadOriginal(docId) {
      try {
        // Construct blob URL
        const blobUrl = `http://127.0.0.1:10000/devstoreaccount1/uploads/${docId}`;

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = docId; // Suggest filename as docId
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download error:", error);
        alert("Failed to download file: " + error.message);
      }
    },

    deleteHistory(docId) {
      if (confirm("Remove this item from history?")) {
        this.uploadHistory = this.uploadHistory.filter(
          (item) => item.docId !== docId
        );
        this.saveHistory();

        // Clear results if viewing this document
        if (this.currentDocId === docId) {
          this.processingResult = null;
          this.currentDocId = null;
        }
      }
    },

    clearAllHistory() {
      if (
        confirm(
          "Clear all history? This will not delete the files from storage."
        )
      ) {
        this.uploadHistory = [];
        this.saveHistory();
        this.processingResult = null;
        this.currentDocId = null;
      }
    },

    saveHistory() {
      localStorage.setItem("uploadHistory", JSON.stringify(this.uploadHistory));
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },

    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    },
  },
  beforeUnmount() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  },
};
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>📄 Document Processor</h1>
      <p class="subtitle">Upload and analyze your documents</p>
    </header>

    <div class="main-container">
      <!-- Left Side: History -->
      <aside class="history-sidebar">
        <div class="history-header">
          <h2>📚 History</h2>
          <button
            v-if="uploadHistory.length > 0"
            @click="clearAllHistory"
            class="clear-btn"
            title="Clear all history"
          >
            🗑️
          </button>
        </div>

        <!-- Search Box -->
        <div v-if="uploadHistory.length > 0" class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Search by filename..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="clear-search-btn"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        <div v-if="uploadHistory.length === 0" class="empty-history">
          <p>No documents yet</p>
          <p class="hint">Upload your first document to get started!</p>
        </div>

        <div v-else-if="filteredHistory.length === 0" class="empty-history">
          <p>No results found</p>
          <p class="hint">Try a different search term</p>
        </div>

        <div v-else class="history-list">
          <div
            v-for="item in filteredHistory"
            :key="item.docId"
            :class="['history-item', { active: item.docId === currentDocId }]"
          >
            <div class="history-info">
              <div class="history-filename">{{ item.fileName }}</div>
              <div class="history-meta">
                <span class="file-size">{{
                  formatFileSize(item.fileSize)
                }}</span>
                <span class="upload-date">{{
                  formatDate(item.uploadedAt)
                }}</span>
              </div>
              <div :class="['status-badge', item.status]">
                {{
                  item.status === "completed" ? "✓ Completed" : "⏳ Processing"
                }}
              </div>
            </div>

            <div class="history-actions">
              <button
                @click="downloadOriginal(item.docId)"
                class="action-btn download-btn"
                title="Download original file"
              >
                📥 Download
              </button>
              <button
                @click="viewResults(item.docId)"
                :disabled="item.status !== 'completed'"
                class="action-btn view-btn"
                title="View results"
              >
                👁️ Results
              </button>
              <button
                @click="deleteHistory(item.docId)"
                class="action-btn delete-btn"
                title="Remove from history"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right Side: Upload & Results -->
      <main class="content-area">
        <!-- Upload Section -->
        <section class="upload-section">
          <div class="upload-box" @dragover.prevent @drop.prevent="handleDrop">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept=".pdf,.docx,.doc,.txt"
              style="display: none"
            />

            <div class="upload-content" @click="$refs.fileInput.click()">
              <div class="upload-icon">📁</div>
              <p class="upload-text">Click to upload or drag and drop</p>
              <p class="upload-hint">Supported: PDF, DOCX, DOC, TXT</p>
            </div>
          </div>

          <button
            v-if="selectedFile"
            @click="uploadFile"
            :disabled="uploading"
            class="upload-button"
          >
            {{ uploading ? "Uploading..." : `Upload ${selectedFile.name}` }}
          </button>
        </section>

        <!-- Status Section -->
        <section v-if="uploadStatus" class="status-section">
          <div :class="['status-box', uploadStatus.type]">
            <span class="status-icon">{{ uploadStatus.icon }}</span>
            <span>{{ uploadStatus.message }}</span>
          </div>
        </section>

        <!-- Results Section -->
        <section v-if="processingResult" class="results-section">
          <h2>📊 Analysis Results</h2>

          <div class="result-card">
            <h3>Document Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">File Name:</span>
                <span class="value">{{ processingResult.fileName }}</span>
              </div>
              <div class="info-item">
                <span class="label">File Type:</span>
                <span class="value">{{ processingResult.fileType }}</span>
              </div>
              <div class="info-item">
                <span class="label">Processed At:</span>
                <span class="value">{{
                  formatDate(processingResult.processedAt)
                }}</span>
              </div>
            </div>
          </div>

          <div class="result-card">
            <h3>📈 Statistics</h3>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">
                  {{ processingResult.statistics.wordCount }}
                </div>
                <div class="stat-label">Words</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">
                  {{ processingResult.statistics.charCount }}
                </div>
                <div class="stat-label">Characters</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">
                  {{ processingResult.statistics.estimatedReadingTime }} min
                </div>
                <div class="stat-label">Reading Time</div>
              </div>
            </div>
          </div>

          <div class="result-card">
            <h3>🔑 Top Keywords</h3>
            <div class="keywords">
              <span
                v-for="keyword in processingResult.topKeywords"
                :key="keyword.word"
                class="keyword-tag"
              >
                {{ keyword.word }} ({{ keyword.count }})
              </span>
            </div>
          </div>

          <div class="result-card">
            <h3>📝 Summary</h3>
            <p class="summary-text">{{ processingResult.summary }}</p>
          </div>

          <div class="result-card">
            <h3>📄 Full Text</h3>
            <div class="full-text">
              {{ processingResult.fullText }}
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
