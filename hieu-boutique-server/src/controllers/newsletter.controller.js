import { client } from '../models/mongoClient.model.js'

const addSubscriber = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ status: 400, message: 'Email không hợp lệ' });
        }

        const db = client.db(process.env.MONGO_DB || 'Hieu-boutique');
        const coll = db.collection('newsletters');

        // upsert subscriber
        await coll.updateOne({ email: email.toLowerCase() }, { $set: { email: email.toLowerCase(), subscribedAt: new Date() } }, { upsert: true });

        return res.status(201).json({ status: 201, message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('newsletter addSubscriber error', error);
        return res.status(500).json({ status: 500, message: 'Lỗi máy chủ' });
    }
}

export default { addSubscriber };
