const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const userObjects = helper.initialUsers
    .map((username) => new User({ username, passwordHash }))
  const userPromises = userObjects.map((user) => user.save())
  await Promise.all(userPromises)

  const createdUser = await User.findOne({ username: helper.initialUsers[0] })
  const userId = createdUser._id

  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs.map((blog) => {
    const blogModel = new Blog(blog)
    blogModel.user = userId
    return blogModel
  })
  const promises = blogObjects.map((blog) => blog.save())
  await Promise.all(promises)
})

describe('when there are initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(2)
  })

  test('blogs have an id property', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    response.body.forEach((blog) => expect(blog.id).toBeDefined())
  })
})

describe('addition of a new blog', () => {
  test('suceeds with valid data', async () => {
    const newBlog = {
      title: '10 useful tips to code in React',
      author: 'Kelly Adam',
      url: 'http://react-code.blogspot.com',
      likes: 17,
    }

    const user = await User.findOne({ username: 'root' })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
  })

  test('fails without an authorization header', async () => {
    const newBlog = {
      title: '10 useful tips to code in React',
      author: 'Kelly Adam',
      url: 'http://react-code.blogspot.com',
      likes: 17,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
  })

  test('without likes property, makes it default to 0', async () => {
    const newBlog = {
      title: 'A tale of a blog without likes',
      author: 'Noli Kes',
      url: 'http://givesomelikes.com',
    }

    const user = await User.findOne({ username: 'root' })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)

    const postResponse = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(postResponse.body.likes).toBe(0)
  })

  test('without title returns a 400 Bad Request error', async () => {
    const newBlog = {
      author: 'Some Author',
      url: 'http://notitle.com',
      likes: 1,
    }

    const user = await User.findOne({ username: 'root' })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)
  })

  test('without url returns a 400 Bad Request error', async () => {
    const newBlog = {
      title: 'Tales from nobody',
      author: 'Kelly Norman',
      likes: 15,
    }

    const user = await User.findOne({ username: 'root' })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)
  })
})

describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const user = await User.findOne({ username: 'root' })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)
    expect(blogsAtEnd).not.toContainEqual(blogToDelete)
  })

  test('fails when trying to delete other user\'s note', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const user = await User.findOne({ username: helper.initialUsers[1] })
    const userForToken = {
      username: user.username,
      id: user._id,
    }
    const token = jwt.sign(userForToken, process.env.SECRET)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
  })
})

describe('updating a note', () => {
  test('amount of likes succeed with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({ likes: 99 })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    blogToUpdate.likes = 99
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toContainEqual(blogToUpdate)
  })

  test('amount of likes fails with a non existing id', async () => {
    await api
      .put(`/api/blogs/${helper.nonExistingId}`)
      .send({ likes: 99 })
      .expect(400)
  })

  test('amount of likes fails with no provided data', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .expect(400)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
