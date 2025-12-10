#!/usr/bin/env node
import { ensureConnected, getCouponsCollection } from '../src/models/mongoClient.model.js'

async function seed(){
  try{
    await ensureConnected()
    const couponsCol = getCouponsCollection()
    if(!couponsCol){
      console.error('Coupons collection not available. Check MONGO_URI and DB connection.')
      process.exit(1)
    }

    const coupons = [
      { code: 'HB50K', title: 'Giảm 50.000₫', sub: 'Đơn tối thiểu 899.000₫', expiry: '2025-12-31', remaining: 999, discount: 50000, onePerUser: false, image: '/assets/imgs/common/voucher.png' },
      { code: 'HB20K', title: 'Giảm 20.000₫', sub: 'Đơn tối thiểu 400.000₫', expiry: '2025-12-31', remaining: 500, discount: 20000, onePerUser: false, image: '/assets/imgs/common/voucher-2.png' },
      { code: 'WELCOME10', title: 'Giảm 10%', sub: 'Cho đơn hàng đầu tiên', expiry: '2026-01-01', remaining: 1000, discount: 0.1, onePerUser: true, image: '/assets/imgs/common/voucher-welcome.png' }
    ]

    for(const c of coupons){
      // upsert by code
      await couponsCol.updateOne({ code: c.code }, { $set: c }, { upsert: true })
      console.log('Upserted', c.code)
    }

    console.log('Seed complete')
    process.exit(0)
  }catch(e){
    console.error('Seed failed', e)
    process.exit(2)
  }
}

seed()
