const { BlobServiceClient } = require('@azure/storage-blob');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require("@google/genai");
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

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Truncate text if too long (Gemini has token limits)
        const maxChars = 30000; // ~7500 tokens
        const textToAnalyze = extractedText.length > maxChars 
            ? extractedText.substring(0, maxChars) + '...[truncated]'
            : extractedText;

        const prompt = `Analyze this document and provide:
            1. A concise summary (2-3 sentences)
            2. Top 10 keywords or key topics
            3. Main themes or insights
            4. Document type/category (e.g., business report, academic paper, article, etc.)
            5. Sentiment/tone (professional, casual, formal, etc.)

            Document text:
            ${textToAnalyze}

            Respond in JSON format like this:
            {
            "summary": "...",
            "keywords": ["keyword1", "keyword2", ...],
            "themes": ["theme1", "theme2", ...],
            "documentType": "...",
            "tone": "..."
            }`;
        
        context.log('🤖 Calling Gemini API...');
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const aiAnalysisText = response.text;
        
        context.log('✅ AI analysis received', response);

        // Parse AI response
        let aiAnalysis = {};
        try {
            // Extract JSON from response (sometimes AI adds markdown code blocks)
            const jsonMatch = aiAnalysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiAnalysis = JSON.parse(jsonMatch[0]);
            } else {
                aiAnalysis = JSON.parse(aiAnalysisText);
            }
        } catch (parseError) {
            context.log.warn('⚠️ Could not parse AI response as JSON, using raw text');
            aiAnalysis = {
                summary: aiAnalysisText,
                keywords: [],
                themes: [],
                documentType: 'unknown',
                tone: 'unknown'
            };
        }

        // Prepare final result
        const finalResult = {
            docId,
            fileName,
            fileType,
            processedAt: new Date().toISOString(),
            statistics: {
                wordCount,
                charCount,
                estimatedReadingTime: Math.ceil(wordCount / 200)
            },
            aiAnalysis: {
                summary: aiAnalysis.summary || '',
                keywords: aiAnalysis.keywords || [],
                themes: aiAnalysis.themes || [],
                documentType: aiAnalysis.documentType || 'unknown',
                tone: aiAnalysis.tone || 'unknown'
            },
            fullText: extractedText // Keep original text
        };

        // Save result to 'processed' container
        const processedContainer = blobServiceClient.getContainerClient('processed');
        await processedContainer.createIfNotExists({ access: 'blob' });
        
        const resultBlobClient = processedContainer.getBlockBlobClient(`${docId}.json`);
        await resultBlobClient.upload(
            JSON.stringify(finalResult, null, 2),
            Buffer.byteLength(JSON.stringify(finalResult, null, 2)),
            { blobHTTPHeaders: { blobContentType: 'application/json' } }
        );

        context.log(`✅ Result saved: ${docId}.json`);
        context.log(`📊 Stats: ${wordCount} words, ${charCount} characters`);
        context.log(`🎯 AI Summary: ${aiAnalysis.summary?.substring(0, 100)}...`);

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