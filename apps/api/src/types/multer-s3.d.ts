// Type definitions for multer-s3
declare namespace Express {
  namespace MulterS3 {
    interface File extends Multer.File {
      bucket: string;
      key: string;
      acl: string;
      contentType: string;
      contentDisposition: string | null;
      storageClass: string;
      serverSideEncryption: string | null;
      metadata: any;
      location: string;
      etag: string;
    }
  }
}
