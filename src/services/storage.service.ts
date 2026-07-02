import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY || "",
    secretAccessKey: process.env.WASABI_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.WASABI_BUCKET_NAME || "school-portal-uploads";

export class StorageService {
  /**
   * Uploads a file buffer to Wasabi S3.
   * @param key The destination path/filename in the bucket (e.g., 'avatars/user1.jpg')
   * @param body The file buffer
   * @param contentType The MIME type of the file
   * @returns The public URL or key of the uploaded file
   */
  static async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      // ACL: 'public-read', // Uncomment if bucket policy allows public objects
    });

    await s3Client.send(command);
    return key; // We return the key so it can be stored in the DB and retrieved securely if needed
  }

  /**
   * Generates a pre-signed URL to view/download a file.
   * @param key The key of the file in the bucket
   * @param expiresIn Expiration time in seconds (default 1 hour)
   */
  static async getFileUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    // Generate a pre-signed URL that expires
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Deletes a file from Wasabi S3.
   * @param key The key of the file in the bucket
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  }
}
