const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: '10 useful tips to code in React',
    author: 'Kelly Adam',
    url: 'http://react-code.blogspot.com',
    likes: 17,
  },
  {
    title: 'Dinner recipes for dummies',
    author: 'Ray Clark',
    url: 'http://cooking-for-dummies.com',
    likes: 53,
  },
]

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map((blog) => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((user) => user.toJSON())
}

const nonExistingId = async () => {
  const blog = new Blog({ content: 'willremovethissoon', date: new Date() })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

module.exports = {
  initialBlogs, blogsInDb, usersInDb, nonExistingId,
}
