import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: "HieuBot",
  initialMessages: [createChatBotMessage("Xin chào! Tôi là HieuBot, trợ lý của Hieu-Boutique. Tôi có thể giúp gì cho bạn?")],
  customStyles: {
    botMessageBox: {
      backgroundColor: "#376B7E",
    },
    chatButton: {
      backgroundColor: "#376B7E",
    },
  },
};

export default config;