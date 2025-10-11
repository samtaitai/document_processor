const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Results API triggered');

    // Handle CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers: corsHeaders };
        return;
    }

    try {
        // await fetch(`${this.apiBaseUrl}/ResultsAPI?docId=${docId}`)
        const docId = req.query.docId;

        if (!docId) {
            context.res = {
                status: 400,
                headers: corsHeaders,
                body: { error: 'docId parameter is required' }
            };
            return;
        }

        // Connect to Blob Storage
        const connectionString = process.env.STORAGE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Check if result exists in processed container
        const processedContainer = blobServiceClient.getContainerClient('processed');
        const resultBlobClient = processedContainer.getBlobClient(`${docId}.json`);

        const exists = await resultBlobClient.exists();

        if (!exists) {
            // Check if original file exists (means still processing)
            const uploadsContainer = blobServiceClient.getContainerClient('uploads');
            const uploadBlobClient = uploadsContainer.getBlobClient(docId);
            const uploadExists = await uploadBlobClient.exists();

            if (uploadExists) {
                context.res = {
                    status: 202, // Accepted, still processing
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    body: {
                        status: 'processing',
                        docId,
                        message: 'Document is still being processed. Please try again in a few moments.'
                    }
                };
            } else {
                context.res = {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    body: {
                        status: 'not_found',
                        docId,
                        error: 'Document not found'
                    }
                };
            }
            return;
        }

        // Download and return the result
        const downloadResponse = await resultBlobClient.download(0);
        const resultJson = await streamToString(downloadResponse.readableStreamBody);
        const result = JSON.parse(resultJson);

        context.res = {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: {
                status: 'completed',
                ...result
            }
        };

    } catch (error) {
        context.log.error('Error in results API:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: 'Failed to retrieve results',
                details: error.message
            }
        };
    }
};

// Helper function to convert stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}