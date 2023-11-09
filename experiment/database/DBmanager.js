require('dotenv').config({ path: '.env' })
const { Pool } = require('pg')

class databaseManager {
    constructor () {
        this.pool = new Pool({
            user: process.env.USER,
            host: process.env.HOST,
            database: process.env.DB,
            password: process.env.PASSWORD,
            port: process.env.PORT,
        })
    }

    async execute(q) {
        const client = await this.pool.connect()
        let result = null
        try {
            result = await client.query(q)
        } catch (err) {
            console.log(err)
        } finally {
            await client.release()
        }
        return result
    }

    async executeParams(q, params) {
        const client = await this.pool.connect()
        let result = null
        try {
            result = await client.query(q, params)
        } catch (err) {
            console.log(err)
        } finally {
            await client.release()
        }
        return result
    }

    /*** INSERT FUNCTIONS REGISTRATION ***/
    async insertRespondent(respondent) {
        const sql = 'INSERT INTO respondents(experience, pc_usage, sex, age, employment, creation) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id'
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [respondent.experience, respondent.pcUsage, respondent.sex, 
                                                        respondent.age, respondent.employment, actualTimestamp])
        return result.rows[0].id
    }

    async insertSession(respondent_id, session) {    
        const sql = 'INSERT INTO sessions(respondent_id, note, prototype, creation) VALUES ($1, $2, $3, $4) RETURNING id'
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [respondent_id, session.note, session.prototype, actualTimestamp])
        return result.rows[0].id
    }

    /*** INSERT FUNCTIONS MINIGAME ***/
    async insertMinigameEvents(event) {    
        const sql = `INSERT INTO minigame_events(
                        session_id, position_x, position_y, timestamp, event, next_target_number, 
                        is_target, game_number, creation) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [event.sessionId, event.posX, event.posY, event.timestamp, event.event, 
                                                event.nextTargetNumber, event.isTarget, event.gameNumber, actualTimestamp])
        return result.rows[0].id
    }

    async insertMinigameTargets(target) {    
        const sql = `INSERT INTO minigame_targets(session_id, position_x, position_y, target_number, game_number, creation) 
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [target.sessionId, target.posX, target.posY, target.targetNumber, 
                                                target.gameNumber, actualTimestamp])
        return result.rows[0].id
    }

    async insertMinigameResult(gameResult) {
        const sql = `INSERT INTO minigame_results(session_id, game_number, points, hits, creation) VALUES ($1, $2, $3, $4, $5) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [gameResult.sessionId, gameResult.gameNumber, gameResult.points, 
                                                    gameResult.hits, actualTimestamp])
        return result.rows[0].id
    }

    /*** INSERT FUNCTIONS POINTS CLICKING ***/
    async insertPointClickingEvents(event) {    
        const sql = `INSERT INTO point_events(
                        session_id, position_x, position_y, timestamp, event, task_id, next_target_number, is_target, creation) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [event.sessionId, event.posX, event.posY, event.timestamp,
                                                 event.event, event.taskId, event.nextTargetNumber, event.isTarget, actualTimestamp])
        return result.rows[0].id
    }

    async insertPointClickingTargets(target) {    
        const sql = `INSERT INTO point_targets(session_id, position_x, position_y, target_number, task_id, creation) 
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [target.sessionId, target.posX, target.posY, target.targetNumber, 
                                                        target.taskId, actualTimestamp])
        return result.rows[0].id
    }

    /*** INSERT FUNCTIONS POINTS PROTOTYPES ***/
    async insertPrototypeEvents(event) {    
        const sql = `INSERT INTO prototype_events(
                        session_id, position_x, position_y, timestamp, event, next_target_number, is_target, prototype_id, creation) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`
        const actualTimestamp = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
        const result = await this.executeParams(sql, [event.sessionId, event.posX, event.posY, event.timestamp, event.event, 
                                                    event.nextTargetNumber, event.isTarget, event.prototypeId, actualTimestamp])
        return result.rows[0].id
    }


    /*** CREATE RESPONDENT AND SESSION FUNCTION => SAVE DATA BEFORE EXPERIMENT ***/
    async createRespondentAndSession(respondent, session) {
        try {
            const respondentId = await this.insertRespondent(respondent)
            const sessionId = await this.insertSession(respondentId, session)
            const result = {
                respondentId: respondentId,
                sessionId: sessionId
            }
            return result
        } catch (e) {
            console.log("error: ", e)
            return null
        }
    }

    async createSession(session) {
        try {
            const sessionId = await this.insertSession(session.respondentId, session)
            const result = {
                sessionId: sessionId
            }
            return result
        } catch (e) {
            console.log("error: ", e)
            return null
        }
    }

    async createGameResult(gameResult) {
        try {
            const resultId = await this.insertMinigameResult(gameResult)
            const result = {
                resultId: resultId
            }
            return result
        } catch (e) {
            console.log("error: ", e)
            return null
        }
    }

    /*** DB SELECTS ***/
    async getTopResults() {
        try {
            const sql = 'SELECT * FROM minigame_results ORDER BY points DESC LIMIT 3'
            const result = await this.execute(sql)
            return result.rows
        } catch (e) {
            console.log("error: ", e)
            return null
        }
    }
}
module.exports = { databaseManager: databaseManager }