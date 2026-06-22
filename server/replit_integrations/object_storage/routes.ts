import express, { type Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();
  ensureUploadsDir();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    const { name, size, contentType } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing required field: name" });
    }

    // Try Replit GCS first; fall back to local disk when sidecar is unavailable
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      return res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch {
      ensureUploadsDir();
      const id = randomUUID();
      const host = `${req.protocol}://${req.get("host")}`;
      const uploadURL = `${host}/api/object-storage/local-upload/${id}`;
      const objectPath = `/objects/local/${id}`;
      return res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    }
  });

  /**
   * Request a presigned PUT URL for file upload (used by ObjectUploader component).
   * 
   * Request body (JSON):
   * {
   *   "fileName": "profile.jpg",
   *   "contentType": "image/jpeg",
   *   "objectDir": "public"
   * }
   * 
   * Response:
   * {
   *   "url": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid",
   *   "fileName": "profile.jpg"
   * }
   */
  app.post("/api/object-storage/put-presigned-url", async (req, res) => {
    const { fileName, contentType, objectDir } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "Missing required field: fileName" });
    }

    // Try Replit GCS first; fall back to local disk when sidecar is unavailable
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      return res.json({ url: uploadURL, objectPath, fileName });
    } catch {
      // Replit sidecar unavailable — use local disk storage
      ensureUploadsDir();
      const id = randomUUID();
      const host = `${req.protocol}://${req.get("host")}`;
      const url = `${host}/api/object-storage/local-upload/${id}`;
      const objectPath = `/objects/local/${id}`;
      return res.json({ url, objectPath, fileName });
    }
  });

  // Receive binary PUT uploads from Uppy when falling back to local disk
  app.put(
    "/api/object-storage/local-upload/:id",
    express.raw({ type: "*/*", limit: "50mb" }),
    (req, res) => {
      try {
        ensureUploadsDir();
        const { id } = req.params;
        if (!/^[0-9a-f-]+$/i.test(id)) {
          return res.status(400).json({ error: "Invalid upload ID" });
        }
        const filePath = path.join(UPLOADS_DIR, id);
        const contentType = req.headers["content-type"] || "application/octet-stream";
        fs.writeFileSync(filePath, req.body as Buffer);
        fs.writeFileSync(`${filePath}.meta`, contentType);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Local upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  // Serve locally uploaded files
  app.get("/objects/local/:id", (req, res) => {
    try {
      const { id } = req.params;
      if (!/^[0-9a-f-]+$/i.test(id)) {
        return res.status(404).json({ error: "Not found" });
      }
      const filePath = path.join(UPLOADS_DIR, id);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }
      const metaPath = `${filePath}.meta`;
      const contentType = fs.existsSync(metaPath)
        ? fs.readFileSync(metaPath, "utf8")
        : "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error("Error serving local file:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  /**
   * Serve public objects.
   * 
   * GET /api/object-storage/public/:filePath(*)
   */
  app.get("/api/object-storage/public/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const publicFile = await objectStorageService.searchPublicObject(filePath);
      
      if (!publicFile) {
        return res.status(404).json({ error: "File not found" });
      }
      
      await objectStorageService.downloadObject(publicFile, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

