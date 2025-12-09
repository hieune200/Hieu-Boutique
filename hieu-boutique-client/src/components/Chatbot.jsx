import './componentStyle/Chatbot.scss'

const ChatBot = ()=>{
	// Simple floating contact button — navigates to /contacts
	return (
		<a href="/contacts" className="floating-chat left" aria-label="Liên hệ Hieu Boutique">
			<span className="inner-circle" aria-hidden>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
					<path d="M10 17l5-5-5-5" stroke="#c21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
				</svg>
			</span>
		</a>
	)
}

export default ChatBot;