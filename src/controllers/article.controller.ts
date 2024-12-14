import { messagesSuccess } from '@/constants/messages';
import Article from '@/models/Article';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

//GET /articles
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const articles = await Article.find({});
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ARTICLES_SUCCESS,
      res: articles,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all articles: ${error}`);
    next(error);
  }
};

//GET /articles/:id
export const getArticleDetail: RequestHandler = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Article not found' });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ARTICLE_SUCCESS,
      res: article,
    });
  } catch (error) {
    logger.log('error', `Catch error in get article detail: ${error}`);
    next(error);
  }
};

//POST /articles
export const createArticle: RequestHandler = async (req, res, next) => {
  try {
    const createArticle = await Article.create(req.body);
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED_ARTICLE_SUCCESS,
      res: createArticle,
    });
  } catch (error) {
    logger.log('error', `Catch error in create article: ${error}`);
    next(error);
  }
};

//PUT /articles/:id
export const updateArticle: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const updateArticle = await Article.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updateArticle) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Article not found' });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_ARTICLE_SUCCESS,
      res: updateArticle,
    });
  } catch (error) {
    logger.log('error', `Catch error in update article: ${error}`);
    next(error);
  }
};

export const softDeleteArticle: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deleteArticle = await Article.findByIdAndUpdate(id, {
      isHidden: false,
    });
    if (!deleteArticle) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Article not found' });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_ARTICLE_SUCCESS,
      res: deleteArticle,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete article: ${error}`);
    next(error);
  }
};

//DELETE /articles/:id
export const deleteArticle: RequestHandler = async (req, res, next) => {
  try {
    const deleteArticle = await Article.findByIdAndDelete(req.params.id);
    if (!deleteArticle) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Article not found' });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_ARTICLE_SUCCESS,
      res: deleteArticle,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete article: ${error}`);
    next(error);
  }
};
