const express = require('express')
require('express-async-errors')
const mongoose = require('mongoose')
const cors = require('cors')
const config = require('./utils/config')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')

const app = express()

mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
})

app.use(cors())
app.use(express.json())
app.use(middleware.tokenExtractor)
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

const errorHandler = (error, request, response, next) => {
  console.log(error)
  if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message.substring(error.message.lastIndexOf(':') + 2) })
  }
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  }

  return next(error)
}
app.use(errorHandler)

module.exports = app
