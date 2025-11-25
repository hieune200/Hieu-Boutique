import express from 'express';
import OpenAI from 'openai';

const chatbot = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in environment variables
});

chatbot.post('/ask', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are HieuBot, a helpful assistant for Hieu-Boutique, a clothing store for women. Answer questions about products, orders, and contact information." },
        { role: "user", content: message }
      ],
    });
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." });
  }
});

export default chatbot;