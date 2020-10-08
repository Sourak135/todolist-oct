import express from 'express'
import bodyParser from 'body-parser'
//import Sequelize from 'sequelize'
//const Op = Sequelize.Op // Bad trick

/*
import * as sq from 'sequelize'
let Op = sq.Op
*/

// import sequelize connector and User and Message models instances
import { sequelize, User, Todo } from './models/db.js'

// Test if database connection is OK else exit
try {
    await sequelize.authenticate() // try to authentificate on the database
    console.log('Connection has been established successfully.')
    await User.sync({ alter: true }) // modify users table schema is something changed
    await Todo.sync({ alter: true }) // same for todos table
} catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
}

// Local network configuration
const IP = '192.168.1.12'
const PORT = 7777

const app = express()

// A middle for checking if an api key is provided by the user
// in the Authorization header
const getApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    if (!key) {
        res.status(403).json({ code: 403, data: 'No api token' })
    } else {
        next()
    }
}

// A middleware for checking if an api token is valid

const validateApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            where: { api_key: key },
        })
        // check if empty results then not found
        if (user.length === 0) {
            res.status(403).json({ code: 403, data: 'Invalid api token' })
        } else {
            next()
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

// A middleware for getting user information based on api_key
// the user's information will be attached to the req object
const getUserByApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'name', 'api_key'],
            where: { api_key: key },
        })
        req.user = user[0]
        next()
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: false })) // to support URL-encoded bodies

//enregistrer un utilisateur
app.post('/register', async (req, res) => {
    const name = req.body.name
    try {
        const user = await User.create({ name: name })
        res.json({ code: 200, data: user })
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

app.use(getApiKey)
app.use(validateApiKey)
app.use(getUserByApiKey)

// créer une tache
//owner = personne logguée
//content = tache indiquée dans le body
//create id?
app.post('/create', async (req, res) => {
    const owner = req.user.id
    const content = req.body.content
    try {
        const todo = await Todo.create({
            owner_id: owner,
            task: content,
        })

        res.status(200).json({ code: 200, data: todo })
    } catch (e) {
        res.status(500).json({ code: 500, data: e })
    }
})

app.get('/list', async (req, res) => {
    const owner = req.user.id
    try {
        const todo = await Todo.findAll({
            attributes: ['id', 'task', 'owner_id', 'done'],
            where: { owner: owner },
        })
        res.status(200).json({ code: 200, data: todo })
    } catch (e) {
        res.status(500).json({ code: 500, data: e })
    }
})

// Start express server
app.listen(PORT, IP, () => {
    console.log(`listening on ${IP}:${PORT}`)
})
