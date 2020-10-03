const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })
  await user.save()
})

describe('when there is initially one user in db', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()
    const newUser = {
      username: 'mluukai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((user) => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with a missing username', async () => {
    const newUser = {
      name: 'Matti Luukainen',
      password: 'salainen',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect((response) => expect(response.body.error).toEqual('Missing username'))
  })

  test('creation fails with a missing password', async () => {
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukainen',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect((response) => expect(response.body.error).toEqual('Missing password'))
  })

  test('creation fails with a short username', async () => {
    const newUser = {
      username: 'ml',
      name: 'Matti Luukainen',
      password: '123456789',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect((response) => expect(response.body.error).toEqual('Username must have a minimum length of 3 characters'))
  })

  test('creation fails with a short password', async () => {
    const newUser = {
      username: 'ml',
      name: 'Matti Luukainen',
      password: '12',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect((response) => expect(response.body.error).toEqual('Password must have a minimum length of 3 characters'))
  })

  test('creation fails with a repeated username', async () => {
    const newUser = {
      username: 'root',
      name: 'Root User',
      password: '12345678',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect((response) => expect(response.body.error).toEqual('username already taken'))
  })

  test('user is returned as json', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const { username } = response.body[0]
    expect(username).toEqual('root')
  })
})

afterAll(() => {
  mongoose.connection.close()
})
