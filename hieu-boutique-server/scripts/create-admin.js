#!/usr/bin/env node
import { ensureConnected, getAccountsCollection } from '../src/models/mongoClient.model.js'
import bcrypt from 'bcrypt'

function parseArgs(){
    const args = process.argv.slice(2)
    const out = {}
    for (let i=0;i<args.length;i++){
        const a = args[i]
        if (a.startsWith('--')){
            const key = a.slice(2)
            const val = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : true
            out[key] = val
            if (val !== true) i++
        }
    }
    return out
}

;(async function main(){
    try{
        const opts = parseArgs()
        const username = opts.username || 'admin'
        const password = opts.password || 'Admin@123'
        const name = opts.name || 'Administrator'
        const force = !!opts.force

        if (!process.env.MONGO_URI){
            console.error('MONGO_URI is not set in the environment. Set it before running this script.')
            process.exit(2)
        }

        await ensureConnected()
        const accounts = getAccountsCollection()
        if (!accounts) {
            console.error('Could not get accounts collection. Is MongoDB connected?')
            process.exit(3)
        }

        const existing = await accounts.findOne({ username })
        if (existing && !force){
            console.error(`User with username "${username}" already exists. Use --force to overwrite.`)
            process.exit(4)
        }

        const saltRounds = 10
        const hashed = bcrypt.hashSync(String(password), saltRounds)

        const doc = {
            username,
            password: hashed,
            name,
            role: 'admin',
            avatar: '/ava.svg'
        }

        if (existing){
            await accounts.updateOne({ _id: existing._id }, { $set: doc })
            console.log(`Updated existing admin user '${username}'.`)
        }else{
            await accounts.insertOne(doc)
            console.log(`Created new admin user '${username}'.`)
        }

        console.log('Done. You can now log in with this account via the admin UI.')
        process.exit(0)
    }catch(err){
        console.error('Failed to create admin user:', err && err.message ? err.message : err)
        process.exit(1)
    }
})()
