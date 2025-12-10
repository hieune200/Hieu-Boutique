import crypto from 'crypto'
import logger from './logger.js'

// Generate a standardized apologetic server error response and log details with an error id
export function makeServerError(req, err, note = ''){
    const id = crypto.randomBytes(5).toString('hex')
    try{
        // Ensure error is serializable: include stack and message when available
        const errPayload = err && (typeof err === 'object') ? { message: err.message || String(err), stack: err.stack || null, name: err.name || null } : err
        logger.error(`[SERVER_ERROR] id=${id} ${note}`, { path: req && req.path, method: req && req.method, body: req && req.body, headers: req && req.headers, err: errPayload })
    }catch(loggingErr){
        // best-effort fallback
        try{ console.error('[LOGGER_ERROR]', loggingErr) }catch(e){}
    }
    // Shorter apologetic message per request — do not expose internal error id to clients
    // The id is logged on the server for diagnostics, but should not be returned to users.
    return { status: '500', message: 'Xin lỗi — đã xảy ra lỗi. Vui lòng thử lại sau.' }
}

export function makeServerErrorDirect(res, req, err, note = ''){
    const payload = makeServerError(req, err, note)
    return res.status(500).json(payload)
}
