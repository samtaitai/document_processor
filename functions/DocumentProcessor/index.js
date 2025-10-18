const { BlobServiceClient } = require('@azure/storage-blob');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// it's triggered by UploadHandler line 114

module.exports = async function (context, myQueueItem) {
    context.log('📄 Document processor triggered');

    try {
        const message = myQueueItem;
        const { docId, fileName, fileType } = message;
        
        context.log(`Processing document: ${docId}`);

        // Connect to Blob Storage
        const connectionString = process.env.STORAGE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Download the file from uploads container
        const uploadsContainer = blobServiceClient.getContainerClient('uploads');
        const blobClient = uploadsContainer.getBlobClient(docId);
        
        // Passing 0 means download from the start (starting byte position)
        const downloadResponse = await blobClient.download(0);
        // a readable stream, which is how large files are handled in Node.js
        // convert that stream into a buffer to process the file data
        const fileBuffer = await streamToBuffer(downloadResponse.readableStreamBody);
        
        context.log(`✅ Downloaded file: ${docId} (${fileBuffer.length} bytes)`);

        // Extract text based on file type
        let extractedText = '';
        let wordCount = 0;
        let charCount = 0;

        if (fileType === '.pdf') {
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
        } else if (fileType === '.docx' || fileType === '.doc') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (fileType === '.txt') {
            extractedText = fileBuffer.toString('utf-8');
        }

        // Calculate statistics
        wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;
        charCount = extractedText.length;

        // Extract top keywords (simple frequency analysis)
        // TODO: Use generative AI for better keyword extraction
        const words = extractedText.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3); // Filter out short words

        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        const topKeywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        // Create summary (first 500 characters)
        const summary = extractedText.substring(0, 500).trim() + (extractedText.length > 500 ? '...' : '');

        // Prepare result
        const result = {
            docId,
            fileName,
            fileType,
            processedAt: new Date().toISOString(),
            statistics: {
                wordCount,
                charCount,
                estimatedReadingTime: Math.ceil(wordCount / 200) // 200 words per minute
            },
            topKeywords,
            summary,
            fullText: extractedText
        };

        // Save result to 'processed' container
        const processedContainer = blobServiceClient.getContainerClient('processed');
        await processedContainer.createIfNotExists({ access: 'blob' });
        
        const resultBlobClient = processedContainer.getBlockBlobClient(`${docId}.json`);
        await resultBlobClient.upload(
            JSON.stringify(result, null, 2),
            Buffer.byteLength(JSON.stringify(result, null, 2)),
            { blobHTTPHeaders: { blobContentType: 'application/json' } }
        );

        context.log(`✅ Result saved: ${docId}.json`);
        context.log(`📊 Stats: ${wordCount} words, ${charCount} characters`);

    } catch (error) {
        context.log.error('❌ Error processing document:', error);
        throw error; // Will move message to poison queue after retries
    }
};

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        // As data comes in from the stream ('data' event), it pushes each chunk into the array.
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        // on 'end' event, it combines all the chunks into a single Buffer using Buffer.concat
        // and resolves the promise with that Buffer.
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}