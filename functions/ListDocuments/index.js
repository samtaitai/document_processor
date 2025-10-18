const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('ListDocuments triggered');

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
        const connectionString = process.env.STORAGE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Get processed container
        const processedContainer = blobServiceClient.getContainerClient('processed');
        
        // Check if container exists
        const exists = await processedContainer.exists();
        if (!exists) {
            context.res = {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: {
                    success: true,
                    count: 0,
                    documents: []
                }
            };
            return;
        }
        
        // List all blobs
        const docList = [];
        for await (const blob of processedContainer.listBlobsFlat()) {
            docList.push({
                docId: blob.name.replace('.json', ''),
                fileName: blob.name,
                size: blob.properties.contentLength,
                createdOn: blob.properties.createdOn,
                lastModified: blob.properties.lastModified
            });
        }

        // Sort by creation date (newest first)
        docList.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

        context.res = {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: {
                success: true,
                count: docList.length,
                documents: docList
            }
        };

        context.log(`✅ Listed ${docList.length} documents`);

    } catch (error) {
        context.log.error('❌ Error listing documents:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: 'Failed to list documents',
                details: error.message
            }
        };
    }
};