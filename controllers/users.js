const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
  const { body } = request
  const saltRounds = 10

  if (!body.password) {
    return response.status(400).send({ error: 'Missing password' })
  }

  if (body.password.length < 3) {
    return response.status(400).send({ error: 'Password must have a minimum length of 3 characters' })
  }

  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  })

  const savedUser = await user.save()
  return response.json(savedUser)
})

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })
  response.status(200).json(users)
})

module.exports = usersRouter
