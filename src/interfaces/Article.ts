import { Types } from "mongoose";

export default interface ArticleType {
  _id: Types.ObjectId;
    title: string;
    thumbnail: string;
    content: string;
    images: string[];
    author: string;
}