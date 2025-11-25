class ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  handleHello = () => {
    const message = this.createChatBotMessage("Chào bạn! Rất vui được gặp bạn. Bạn cần hỗ trợ gì về sản phẩm của Hieu-Boutique?");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleProducts = () => {
    const message = this.createChatBotMessage("Chúng tôi có nhiều loại quần áo, phụ kiện cho nữ. Bạn có thể xem tại trang chủ hoặc tìm kiếm sản phẩm!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleOrder = () => {
    const message = this.createChatBotMessage("Để đặt hàng, hãy thêm sản phẩm vào giỏ và tiến hành thanh toán. Nếu cần hỗ trợ, liên hệ hotline!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleContact = () => {
    const message = this.createChatBotMessage("Liên hệ chúng tôi qua email: hieu@boutique.com hoặc hotline: 0123-456-789. Chúng tôi luôn sẵn sàng hỗ trợ!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleDefault = () => {
    const message = this.createChatBotMessage("Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về sản phẩm, đặt hàng hoặc liên hệ nhé!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };
}

export default ActionProvider;