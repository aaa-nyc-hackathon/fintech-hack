import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

// Storage client will be initialized inside the function when env vars are available

export async function POST(request: NextRequest) {
  try {
    // Check environment variables and provide fallbacks
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'ai-fintech-hackathon';
    const bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || 'finteck-hackathon';
    const clientEmail = process.env.NEXT_PUBLIC_GCS_CLIENT_EMAIL || 'missing-client-email';
    const privateKey = process.env.NEXT_PUBLIC_GCS_PRIVATE_KEY || 'missing-private-key';
    
         console.log('🔍 Environment check:');
     console.log('PROJECT_ID:', process.env.NEXT_PUBLIC_PROJECT_ID ? 'Set' : `Missing (using fallback: ${projectId})`);
     console.log('GCS_BUCKET_NAME:', process.env.NEXT_PUBLIC_GCS_BUCKET_NAME ? 'Set' : `Missing (using fallback: ${bucketName})`);
     console.log('GCS_CLIENT_EMAIL:', process.env.NEXT_PUBLIC_GCS_CLIENT_EMAIL ? 'Set' : `Missing (using fallback: ${clientEmail})`);
     console.log('GCS_PRIVATE_KEY:', process.env.NEXT_PUBLIC_GCS_PRIVATE_KEY ? 'Set' : `Missing (using fallback: ${privateKey})`);
     
     // Check if we have actual credentials (not fallbacks)
     if (!process.env.NEXT_PUBLIC_GCS_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_GCS_PRIVATE_KEY) {
      console.error('❌ Missing required GCS credentials');
             return NextResponse.json({ 
         error: 'Missing required GCS credentials',
         details: 'Please create a .env.local file with NEXT_PUBLIC_GCS_CLIENT_EMAIL and NEXT_PUBLIC_GCS_PRIVATE_KEY from your service account',
         setup_guide: 'Check frontend/GCS_SETUP.md for detailed instructions'
       }, { status: 500 });
    }
    
    // Initialize storage client with environment variables or fallbacks
    const storage = new Storage({
      projectId: projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });
    
    const bucket = storage.bucket(bucketName);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `uploads/${timestamp}-${originalName}`;

    // Upload to GCS
    console.log('📤 Starting GCS upload to bucket:', bucketName);
    console.log('📁 Filename:', filename);
    console.log('📏 File size:', buffer.length, 'bytes');
    
    const gcsFile = bucket.file(filename);
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      // Note: public access is managed at bucket level via IAM permissions
      // not via object ACLs when Uniform Bucket-Level Access is enabled
    });
    
    console.log('✅ GCS upload completed successfully');

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    const gcsUri = `gs://${bucketName}/${filename}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename,
      publicUrl,
      gcsUri,
      size: file.size,
      type: file.type,
      bucket: bucketName,
      project: projectId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 