import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from "openai";
import fs from "fs";
import chalk from "chalk";

const openai = new OpenAI();


//convert png to base64 since idk the api wants it to
const base64Image = fs.readFileSync("captured_image.png", {
    encoding: "base64"
});

//first api call for the analysis
(async () => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Describe the clothing and style seen in the provided image with attention to detail. Ignore any facial features or personal identifiable qualities, only focus on the clothing and style. I REPEAT ONLY FOCUS ON THE CLOTHING AND STYLE. IF THERE ARE MULTIPLE FIGURES IN THE PICTURE. SELECT THE ONE IN THE MIDLE OF THE FRAME TO ANALYZE THEIR CLOTHING AND STYLE AND IGNORE EVERYONE ELSE. Identify clothing types (e.g., shirt, jacket, dress), colors, patterns, textures, and any accessories (e.g., jewelry, hats, bags). If for example you identified an object but don't know what it is, let it be called unidentifiable object. Only return the JSON structure, nothing else Do not return ```json. I REPEAT UNDER NO CIRCUMSTANCES YOU RETURN ```json"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`,
                            }
                        }
                    ]
                }
            ]
        });

        const content = completion.choices[0].message.content;

        if (content) {
            const jsonData = JSON.parse(content);

            console.log(chalk.bold.underline("\nClothing Analysis:\n"));

            if (jsonData.clothing) {
                console.log(chalk.blue.bold("Clothing:"));
                Object.entries(jsonData.clothing).forEach(([part, details]) => {
                    console.log(chalk.yellow(`  ${part.charAt(0).toUpperCase() + part.slice(1)}:`));
                    Object.entries(details).forEach(([key, value]) => {
                        console.log(chalk.green(`    ${key}: `) + chalk.white(value));
                    });
                });
                console.log();
            }

            if (jsonData.accessories && jsonData.accessories.length > 0) {
                console.log(chalk.magenta.bold("Accessories:"));
                jsonData.accessories.forEach((accessory, index) => {
                    console.log(chalk.cyan(`  Accessory ${index + 1}:`));
                    Object.entries(accessory).forEach(([key, value]) => {
                        console.log(chalk.green(`    ${key}: `) + chalk.white(value));
                    });
                });
            }
// second api call for the suggestions
            const adviceCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: "Based on the clothing details provided in the JSON structure, suggest styling advice to enhance the overall look. Mention specific ideas for matching accessories, layering options, color pairings, and any modern style tips that would suit the described outfit. Format it very very insanely concisely, almost saying only item to add, do not talk about the reasoning to why you suggested that or what effect it does. Maximum of 2 suggestions. Return this in a JSON structure with each suggestion as a separate bullet point in a 'suggestions' array. Only return the JSON structure, nothing else. DO NOT RETURN ``json under any circumstances. "
                    },
                    {
                        role: "assistant",
                        content: JSON.stringify(jsonData)
                    }
                ]
            });

            const adviceContent = adviceCompletion.choices[0].message.content;

            // Attempt to parse and display styling advice neatly
            try {
                const adviceData = JSON.parse(adviceContent);
                console.log(chalk.bold.underline("\nStyling Advice:\n"));

                if (adviceData.suggestions && adviceData.suggestions.length > 0) {
                    adviceData.suggestions.forEach((suggestion, index) => {
                        console.log(chalk.green(`• Suggestion ${index + 1}: `) + chalk.white(suggestion));
                    });
                } else {
                    console.log(chalk.red("No Suggestions: You're looking sharp =)"));
                }
            } catch (error) {
                console.error(chalk.red("Error parsing json"), error);
                console.log("Raw output:", adviceContent); //debug console log line
            }
        } else {
            console.log(chalk.red("Retake the picture with only one person in the frame and without your face"));
        }
    } catch (error) {
        console.error(chalk.red("An error occurred during the API call"), error);
    }
})();
