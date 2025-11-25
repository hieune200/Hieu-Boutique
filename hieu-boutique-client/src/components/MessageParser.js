class MessageParser {
  constructor(actionProvider, state) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("xin chào")) {
      this.actionProvider.handleHello();
    } else if (lowerCaseMessage.includes("sản phẩm") || lowerCaseMessage.includes("quần áo")) {
      this.actionProvider.handleProducts();
    } else if (lowerCaseMessage.includes("đặt hàng") || lowerCaseMessage.includes("mua")) {
      this.actionProvider.handleOrder();
    } else if (lowerCaseMessage.includes("liên hệ") || lowerCaseMessage.includes("hỗ trợ")) {
      this.actionProvider.handleContact();
    } else {
      this.actionProvider.handleDefault();
    }
  }
}

export default MessageParser;