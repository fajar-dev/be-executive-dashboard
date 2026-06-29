import { config } from "../../config/config"
import { FeedbackItem } from "./serializers/feedback.serialize"
import * as path from "path"
import * as fs from "fs"

const UPLOAD_DIR = path.resolve("./uploads/feedback")

export class FeedbackService {
    /**
     * Menyimpan feedback beserta gambar ke penyimpanan lokal
     * @param userId - ID user yang mengirim feedback
     * @param name - Nama user
     * @param data - Data feedback (message, type, url)
     * @param imageFiles - Array file gambar yang diupload
     * @returns Array URL gambar yang telah disimpan
     */
    async store(userId: number, name: string, data: { message: string; type: string; url?: string }, imageFiles: File[]) {
        const timestamp = Date.now()
        const imageUrls: string[] = []

        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true })
        }

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i]
            const rawExt = file.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const fileName = `${userId}_${timestamp}_${i}.${ext}`
            const filePath = path.join(UPLOAD_DIR, fileName)

            const buffer = Buffer.from(await file.arrayBuffer())
            await Bun.write(filePath, buffer)

            const url = `${config.app.appUrl}/uploads/feedback/${fileName}`
            imageUrls.push(url)
        }

        fetch(config.feedback.scriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: String(userId),
                name,
                image: imageUrls,
                url: data.url ?? "",
                type: data.type,
                message: data.message,
            }),
        }).catch(() => {})

        return imageUrls
    }

    async getByUser(userId: number): Promise<FeedbackItem[]> {
        const response = await fetch(config.feedback.scriptUrl)
        if (!response.ok) {
            return []
        }

        const data = await response.json() as FeedbackItem[]
        return data.filter((item) => String(item.userId) === String(userId))
    }
}