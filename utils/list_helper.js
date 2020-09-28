const _ = require('lodash')

const dummy = () => 1

const totalLikes = (blogs) => blogs.reduce((sum, blog) => sum + blog.likes, 0)

const mostBlogs = (blogs) => _.transform(_.countBy(blogs, (blog) => blog.author), (result, value, key) => (value > result.blogs ? _.assign(result, { author: key, blogs: value }) : result), { author: '', blogs: 0 })

const mostLikes = (blogs) => {
  const likesCount = _.reduce(blogs, (result, value) => {
    // eslint-disable-next-line no-param-reassign
    result[value.author] = (result[value.author] || 0) + value.likes
    return result;
  }, {})

  return _.transform(likesCount, (result, value, key) => (value > result.likes ? _.assign(result, { author: key, likes: value }) : result), { author: '', likes: 0 })
}

module.exports = {
  dummy,
  totalLikes,
  mostBlogs,
  mostLikes,
}
