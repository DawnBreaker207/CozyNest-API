import { RequestHandler } from 'express';
import Product from '../models/Product';

class ProductController {
  Get_All: RequestHandler = async (req, res) => {
    try {
      const data = await Product.find().populate('category');
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };

  Get_One: RequestHandler = async (req, res) => {
    try {
      const data = await Product.findById(req.params.id).populate('category');
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  Update: RequestHandler = async (req, res) => {
    try {
      const data = await Product.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  Delete: RequestHandler = async (req, res) => {
    try {
      const data = await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  Create: RequestHandler = async (req, res) => {
    try {
      const data = await Product.create(req.body);
      res.status(200).json({
        data: data,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
}
export default ProductController;
