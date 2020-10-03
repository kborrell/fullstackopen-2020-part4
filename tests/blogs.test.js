const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog))
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

    const postResponse = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    newBlog.id = postResponse.body.id

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
    expect(response.body).toContainEqual(newBlog)
  })

  test('without likes proparty, makes it default to 0', async () => {
    const newBlog = {
      title: 'A tale of a blog without likes',
      author: 'Noli Kes',
      url: 'http://givesomelikes.com',
    }

    const postResponse = await api
      .post('/api/blogs')
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

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
  })

  test('without url returns a 400 Bad Request error', async () => {
    const newBlog = {
      title: 'Tales from nobody',
      author: 'Kelly Norman',
      likes: 15,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
  })
})

describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)
    expect(blogsAtEnd).not.toContainEqual(blogToDelete)
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
