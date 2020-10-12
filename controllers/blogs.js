const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const { body, token } = request
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!(token && decodedToken.id)) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)
  console.log(body)
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id,
  })

  if (!blog.likes) {
    blog.likes = 0
  }

  const savedBlog = await blog.save()
  await savedBlog.populate('user', { username: 1, name: 1 }).execPopulate()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  return response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  const { token } = request
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!(token && decodedToken.id)) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  if (decodedToken.id !== blog.user.toString()) {
    return response.status(401).json({ error: 'user is not the author of the blog' })
  }

  await blog.deleteOne()
  return response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const blog = request.body
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedBlog.toJSON())
})

module.exports = blogsRouter
