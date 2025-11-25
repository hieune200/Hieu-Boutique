class ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  async handleMessage(message) {
    try {
      const response = await fetch('https://hieu-boutique-onx8d3dvq-hieunguyens-projects-2184091d.vercel.app/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      const botMessage = this.createChatBotMessage(data.response);
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    } catch (error) {
      const botMessage = this.createChatBotMessage("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    }
  }

  handleHello = () => {
    this.handleMessage("Xin chào");
  };

  handleProducts = () => {
    this.handleMessage("Tôi muốn hỏi về sản phẩm");
  };

  handleOrder = () => {
    this.handleMessage("Tôi muốn hỏi về đặt hàng");
  };

  handleContact = () => {
    this.handleMessage("Tôi muốn hỏi về liên hệ");
  };

  handleDefault = () => {
    this.handleMessage("Tôi có câu hỏi khác");
  };
}

export default ActionProvider;