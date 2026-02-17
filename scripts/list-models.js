
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function listModels() {
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        try {
            const envPath = path.resolve(__dirname, '..', '.env.local');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                const match = content.match(/GEMINI_API_KEY=["']?([^"'\n\r]+)["']?/);
                if (match) {
                    apiKey = match[1];
                    console.log("Found API key in .env.local");
                }
            }
        } catch (e) {
            console.error("Error reading .env.local:", e);
        }
    }

    if (!apiKey) {
        console.error("API key not found. Please set GEMINI_API_KEY in .env.local");
        return;
    }

    // const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Models:");
            const output = data.models
                .filter(m => m.name.includes("gemini"))
                .map(m => `- ${m.name.replace("models/", "")} [${m.supportedGenerationMethods?.join(", ")}]`)
                .join("\n");

            fs.writeFileSync("models_direct.txt", output, "utf8");
            console.log("Wrote models to models_direct.txt");
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
