const { GoogleGenAI, Type } = require("@google/genai");
const dotenv = require('dotenv');

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Structured shape we want Gemini to return. Using a response schema instead of
// asking for free-form Markdown means the frontend never has to parse prose —
// it just renders fields.
const reviewSchema = {
    type: Type.OBJECT,
    properties: {
        timeComplexity: { type: Type.STRING, description: "Big O time complexity, e.g. O(N log N)" },
        timeComplexityExplanation: { type: Type.STRING, description: "Why the code has this time complexity" },
        spaceComplexity: { type: Type.STRING, description: "Big O auxiliary space complexity, e.g. O(1)" },
        spaceComplexityExplanation: { type: Type.STRING, description: "Why the code has this space complexity" },
        isOptimal: { type: Type.BOOLEAN, description: "Whether the current approach is already optimal" },
        optimizationNote: { type: Type.STRING, description: "If not optimal, the target complexity and approach to get there. Empty string if already optimal." },
        edgeCases: {
            type: Type.ARRAY,
            description: "Standard DSA edge cases evaluated against this code",
            items: {
                type: Type.OBJECT,
                properties: {
                    case: { type: Type.STRING, description: "Name of the edge case, e.g. 'Empty input', 'Integer overflow'" },
                    handled: { type: Type.BOOLEAN, description: "Whether the code correctly handles this case" },
                    notes: { type: Type.STRING, description: "Short explanation of how it is or isn't handled" }
                },
                required: ["case", "handled", "notes"]
            }
        },
        customInputAnalysis: { type: Type.STRING, description: "Trace of the user's custom input through the code, if one was provided. Empty string otherwise." },
        bugs: {
            type: Type.ARRAY,
            description: "Logical bugs or flaws found via dry run. Empty array if none found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    issue: { type: Type.STRING, description: "Short title of the bug" },
                    trace: { type: Type.STRING, description: "Step-by-step trace demonstrating the bug" }
                },
                required: ["issue", "trace"]
            }
        },
        refactoredCode: { type: Type.STRING, description: "Clean, optimized, fully commented version of the code" },
        refactoredCodeNotes: { type: Type.STRING, description: "Brief note on what changed and why, relative to the original code" }
    },
    required: [
        "timeComplexity", "timeComplexityExplanation",
        "spaceComplexity", "spaceComplexityExplanation",
        "isOptimal", "optimizationNote",
        "edgeCases", "customInputAnalysis", "bugs",
        "refactoredCode", "refactoredCodeNotes"
    ]
};

const aiReview = async (req, res) => {
    try {
        const { code, language, description, input } = req.body;

        if (!code) {
            return res.status(400).json({ error: "No code provided for review." });
        }

        const descriptionBlock = description
            ? `### Problem Description / Constraints:\n${description}\n`
            : '';

        const inputBlock = input
            ? `### User's Provided Test Input (stdin):\n\`\`\`\n${input}\n\`\`\`\n`
            : '';

        const prompt = `
        You are a technical interview coach and DSA expert. Analyze the following ${language || ''} code written to solve an algorithmic problem.

        ${descriptionBlock}
        ${inputBlock}

        ### Code to Review:
        \`\`\`${language || ''}
        ${code}
        \`\`\`

        ---
        Review the code thoroughly based on competitive programming and technical interview standards, and respond ONLY with a JSON object matching the provided schema. Follow these rules for each field:

        - timeComplexity / spaceComplexity: state the current Big O (e.g. "O(N^2)", "O(1)").
        - timeComplexityExplanation / spaceComplexityExplanation: explain briefly why, in plain language.
        - isOptimal: true only if the approach is already asymptotically optimal for this problem.
        - optimizationNote: if isOptimal is false, name the target optimal complexity and the technique to get there. If isOptimal is true, leave this as an empty string.
        - edgeCases: evaluate standard DSA boundaries — empty/null input, size-1 input, very large values, and integer overflow if relevant to the language. One entry per case you evaluate.
        - customInputAnalysis: ${input ? "trace the code against the user's custom input above and state whether the output would be correct." : "leave as an empty string, since no custom input was provided."}
        - bugs: list any logical bugs or infinite loops with a short text dry-run trace proving each one. If there are none, return an empty array.
        - refactoredCode: provide a clean, optimized, fully commented version of the code. If the original was already optimal, provide a clean, more readable version of the same approach instead.
        - refactoredCodeNotes: one or two sentences on what changed and why.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reviewSchema
            }
        });

        let review;
        try {
            review = JSON.parse(response.text);
        } catch (parseErr) {
            console.error("DSA AI Review JSON Parse Error:", parseErr, response.text);
            return res.status(502).json({ error: "AI returned a malformed review. Please try again." });
        }

        return res.status(200).json({ review });

    } catch (error) {
        console.error("DSA AI Review Error:", error);
        return res.status(500).json({ error: "Failed to generate DSA review." });
    }
};


module.exports = {
    aiReview
}