import { RequestHandler } from 'express';
import Category from '../models/Category';

class CategoryController {
  getAll: RequestHandler = async (req, res) => {
    try {
      const data = await Category.find().populate('product');
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };

  getOne: RequestHandler = async (req, res) => {
    try {
      const data = await Category.findById(req.params.id).populate('product');
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  update: RequestHandler = async (req, res) => {
    try {
      const data = await Category.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  delete: RequestHandler = async (req, res) => {
    try {
      const data = await Category.findByIdAndDelete(req.params.id);
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  create: RequestHandler = async (req, res) => {
    try {
      const data = await Category.create(req.body);
      res.status(200).json({
        data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
}
export default CategoryController;
