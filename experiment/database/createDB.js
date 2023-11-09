require('dotenv').config({ path: '.env' })
const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    password: process.env.PASSWORD,
    port: process.env.PORT,
})

async function createDB () {
    console.log('starting DBcreating')
    let create_string = 'CREATE DATABASE' + ' ' + process.env.DB
    const result = await pool.query(create_string)
    console.log('DB created')
    await pool.end()
    console.log('pool ended')
}

async function main () {
    console.log('main started')
    await createDB()
    console.log('main ended')
}

main()
