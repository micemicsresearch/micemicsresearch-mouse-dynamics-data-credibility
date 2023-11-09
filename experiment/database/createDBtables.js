require('dotenv').config({ path: '.env' })
const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: process.env.PORT,
})

//CREATE DB TABLES COMMANDS
const respondents = `
    CREATE TABLE IF NOT EXISTS respondents (
        id serial NOT NULL,
        experience integer NOT NULL,
        pc_usage character varying(50) NOT NULL,
        sex character varying(20) NOT NULL,
        age integer NOT NULL,
        employment character varying(50) NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id")
    );`

const sessions = `
    CREATE TABLE IF NOT EXISTS sessions (
        id serial NOT NULL,
        respondent_id integer NOT NULL,
        note character varying(100),
        prototype character varying(10),
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("respondent_id") REFERENCES respondents("id") ON DELETE CASCADE
    );`


const point_events = `
    CREATE TABLE IF NOT EXISTS point_events (
        id serial NOT NULL,
        session_id integer NOT NULL,
        position_x integer NOT NULL,
        position_y integer NOT NULL,
        timestamp integer NOT NULL,
        event character varying(20) NOT NULL,
        task_id character varying(10) NOT NULL,
        next_target_number integer NOT NULL,
        is_target boolean,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`

const point_targets = `
    CREATE TABLE IF NOT EXISTS point_targets (
        id serial NOT NULL,
        session_id integer NOT NULL,
        position_x integer NOT NULL,
        position_y integer NOT NULL,
        target_number integer NOT NULL,
        task_id character varying(10) NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`

const prototype_events = `
    CREATE TABLE IF NOT EXISTS prototype_events (
        id serial NOT NULL,
        session_id integer NOT NULL,
        position_x integer NOT NULL,
        position_y integer NOT NULL,
        timestamp integer NOT NULL,
        event character varying(20) NOT NULL,
        next_target_number integer NOT NULL,
        is_target boolean,
        prototype_id character varying(10) NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`

const minigame_events = `
    CREATE TABLE IF NOT EXISTS minigame_events (
        id serial NOT NULL,
        session_id integer NOT NULL,
        position_x integer NOT NULL,
        position_y integer NOT NULL,
        timestamp integer NOT NULL,
        event character varying(20) NOT NULL,
        next_target_number integer NOT NULL,
        is_target boolean,
        game_number integer NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`

const minigame_targets = `
    CREATE TABLE IF NOT EXISTS minigame_targets (
        id serial NOT NULL,
        session_id integer NOT NULL,
        position_x integer NOT NULL,
        position_y integer NOT NULL,
        target_number integer NOT NULL,
        game_number integer NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`

const minigame_results = `
    CREATE TABLE IF NOT EXISTS minigame_results (
        id serial NOT NULL,
        session_id integer NOT NULL,
        points integer NOT NULL,
        hits integer NOT NULL,
        game_number integer NOT NULL,
        creation timestamp NOT NULL, 
        PRIMARY KEY ("id"),
        FOREIGN KEY ("session_id") REFERENCES sessions("id") ON DELETE CASCADE
    );`


async function execute (query) {
    const client = await pool.connect()
    try {
        const result = await client.query(query)
        // console.log(result)
    } catch (err) {
        console.log(err)
    } finally {
        await client.release()
        // console.log('client released')
    }
}

async function main () {
    console.log('DB creation started')

    await execute(respondents)
    await execute(sessions)

    await execute(point_events)
    await execute(point_targets)

    await execute(prototype_events)

    await execute(minigame_events)
    await execute(minigame_targets)
    await execute(minigame_results)

    console.log('DB creation ended')

    await pool.end()
}

main()