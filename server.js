// server.js
import express from 'express';
import multer from 'multer';
import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';

config();
const app = express();
const openai = new OpenAI();
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// Handle image upload and OpenAI request
app.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Describe the clothing and style of the person in the provided image with attention to detail. Identify clothing types (e.g., shirt, jacket, dress), colors, patterns, textures, and any accessories (e.g., jewelry, hats, bags). Only return the JSON structure, nothing else."
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/png;base64,${base64Image}` }
                        }
                    ]
                }
            ]
        });

        // Send JSON result back to the frontend
        res.json(completion.choices[0].message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing the image' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
