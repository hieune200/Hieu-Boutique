import JWT from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

function authenticateJWT(req, res, next){
	try{
		const auth = req.headers['authorization'] || req.headers['Authorization'] || ''
		if (!auth) return res.status(401).json({ status: '401', message: 'Token không được cung cấp' })
		const parts = String(auth).split(' ')
		const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : parts[0]
		JWT.verify(token, JWT_SECRET, (err, decoded)=>{
			if (err) return res.status(401).json({ status: '401', message: 'Token không hợp lệ' })
			// attach user id
			req.userId = decoded && decoded.id ? decoded.id : null
			req.user = decoded || null
			next()
		})
	}catch(e){
		console.error('authenticateJWT error', e)
		return res.status(401).json({ status: '401', message: 'Yêu cầu không hợp lệ' })
	}
}

export { authenticateJWT }

// require that the authenticated user is an admin
function requireAdmin(req, res, next){
	try{
		const user = req.user || null
		if (!user) return res.status(403).json({ status: '403', message: 'Không có quyền (chưa đăng nhập)' })
		// allow if token contains role: 'admin' or isAdmin flag
		if (user.role && String(user.role).toLowerCase() === 'admin') return next()
		if (user.isAdmin) return next()
		return res.status(403).json({ status: '403', message: 'Yêu cầu quyền admin' })
	}catch(e){
		console.error('requireAdmin error', e)
		return res.status(403).json({ status: '403', message: 'Yêu cầu quyền admin' })
	}
}

export { requireAdmin }
