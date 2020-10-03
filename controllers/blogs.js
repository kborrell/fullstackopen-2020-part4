const blogsRouter = require('express').Router()
const { random } = require('lodash')
const _ = require('lodash')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const { body } = request
  const users = await User.find({})

  const randomUser = _.sample(users)
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: randomUser._id,
  })

  const savedBlog = await blog.save()
  randomUser.blogs = randomUser.blogs.concat(savedBlog._id)
  await randomUser.save()
  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  if (!request.body.likes) {
    return response.status(400).send({ error: 'missing likes property' })
  }
  const updatedBlog = await Blog
    .findByIdAndUpdate(request.params.id, { likes: request.body.likes }, { new: true })
  return response.json(updatedBlog)
})

module.exports = blogsRouter
