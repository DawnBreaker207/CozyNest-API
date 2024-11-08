import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: [
    {
      heading: {
        type: String
      },
      paragraph: {
        type: String,
        required: true
      },
      images: [
        {
          url: String,
          caption: String
        }
      ]
    }
  ],
  author: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Article = mongoose.model("Article", ArticleSchema);

export default Article