import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
    const bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME!;
    const clientEmail = process.env.NEXT_PUBLIC_GCS_CLIENT_EMAIL!;
    const privateKey = process.env.NEXT_PUBLIC_GCS_PRIVATE_KEY!.replace(/\\n/g, '\n');

    const storage = new Storage({
      projectId,
      credentials: { client_email: clientEmail, private_key: privateKey },
    });

    const bucket = storage.bucket(bucketName);

    const { fileName, fileBuffer } = await request.json(); // expects base64 or buffer
    const file = bucket.file(fileName);

    await file.save(Buffer.from(fileBuffer, 'base64'), {
      contentType: 'video/mp4',
    });

    return NextResponse.json({ success: true, gcsUri: `gs://${bucketName}/${fileName}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
