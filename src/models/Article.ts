import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  content: [
    {
      heading: {
        type: String,
      },
      paragraph: {
        type: String,
      },
      images: [
        {
          url: String,
          caption: String,
        },
      ],
    },
  ],
  author: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Article = mongoose.model('Article', ArticleSchema);

export default Article;
