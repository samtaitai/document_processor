const { BlobServiceClient } = require('@azure/storage-blob');
const { QueueServiceClient } = require('@azure/storage-queue');
const multipart = require('parse-multipart-data');

module.exports = async function (context, req) {
    // the context argument provides methods for logging and returning HTTP responses
    context.log('Upload handler triggered');

    // Handle CORS preflight
    // necessary to support cross-origin requests
    // HTTP OPTIONS request is a preliminary check before the real request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
        return;
    }

    // handle the actual request
    try {
        // Parse multipart form data
        if (!req.body || !req.headers['content-type']) {
            context.res = {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: 'No file uploaded' }
            };
            return;
        }

        const contentType = req.headers['content-type'];
        // takes the file data from the request
        // turns it into a "buffer," 
        // which is just a way for Node.js to handle raw binary data
        const bodyBuffer = Buffer.from(req.body);
        // extract files and data from a multipart/form-data HTTP request
        const boundary = multipart.getBoundary(contentType);
        const parts = multipart.parse(bodyBuffer, boundary);

        if (!parts || parts.length === 0) {
            context.res = {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: 'No file found in request' }
            };
            return;
        }
        // We expect a single file upload
        const file = parts[0];
        const fileName = file.filename;
        const fileData = file.data;

        // Validate file type
        const allowedTypes = ['.pdf', '.docx', '.txt', '.doc'];
        const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
        if (!allowedTypes.includes(fileExt)) {
            context.res = {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: `File type ${fileExt} not supported. Allowed: ${allowedTypes.join(', ')}` }
            };
            return;
        }

        // Generate unique document ID
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const docId = `${timestamp}-${sanitizedName}`;

        // Connect to Azurite Blob Storage
        // process.env.STORAGE_CONNECTION_STRING is set in local.settings.json
        const connectionString = process.env.STORAGE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Upload to 'uploads' container
        const containerClient = blobServiceClient.getContainerClient('uploads');
        // Create container if it doesn't exist
        // The { access: 'blob' } option sets the container's access level so blobs can be read anonymously
        await containerClient.createIfNotExists({ access: 'blob' });
        
        // creates a client for a blob with the name docId—even if it doesn't exist yet
        // then uploads the file data to that blob
        const blockBlobClient = containerClient.getBlockBlobClient(docId);
        await blockBlobClient.upload(fileData, fileData.length, {
            blobHTTPHeaders: { blobContentType: file.type || 'application/octet-stream' }
        });

        context.log(`✅ File uploaded to blob: ${docId}`);

        // Send message to Queue
        const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
        const queueClient = queueServiceClient.getQueueClient('document-processing');
        
        // Create queue if it doesn't exist
        await queueClient.createIfNotExists();

        const message = {
            docId: docId,
            fileName: fileName,
            fileSize: fileData.length,
            fileType: fileExt,
            uploadedAt: new Date().toISOString()
        };

        // Send message (Azure Queue expects base64 encoded string)
        // convert the message object to a JSON string(text representation of JS object)
        // then to a Buffer, and finally to a base64 string(bianry data)
        await queueClient.sendMessage(Buffer.from(JSON.stringify(message)).toString('base64'));

        context.log(`✅ Message sent to queue for: ${docId}`);

        // Return success response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                docId: docId,
                fileName: fileName,
                fileSize: fileData.length,
                message: 'File uploaded successfully and queued for processing'
            }
        };

    } catch (error) {
        context.log.error('❌ Error in upload handler:', error);
        context.res = {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { 
                error: 'Failed to process upload',
                details: error.message 
            }
        };
    }
};