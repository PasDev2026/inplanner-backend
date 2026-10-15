import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { s3, S3_BUCKET } from '../../uploads/s3.client';

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const EXPORT_PREFIX = 'inplanner/mcp-exports';
const EXPORT_URL_TTL_SECONDS = 3600;

export interface ExportedFile {
  url: string;
  key: string;
  expiresInSeconds: number;
}

/**
 * Sube un buffer `.xlsx` a S3 y devuelve un link presignado temporal.
 * El link expira en `EXPORT_URL_TTL_SECONDS` (1 hora).
 */
export async function uploadExcelAndSign(
  buffer: Buffer,
  fileName: string,
): Promise<ExportedFile> {
  const key = `${EXPORT_PREFIX}/${randomUUID()}-${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: XLSX_MIME_TYPE,
    }),
  );

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: EXPORT_URL_TTL_SECONDS },
  );

  return { url, key, expiresInSeconds: EXPORT_URL_TTL_SECONDS };
}
