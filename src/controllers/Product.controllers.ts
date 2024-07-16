import { RequestHandler } from 'express';
import { Product } from '../models/Product';

const Get_All: RequestHandler = async (req, res) => {
  try {
    const data = await Product.find().populate('category');
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Get_One: RequestHandler = async (req, res) => {
  try {
    const data = await Product.findById(req.params.id).populate('category');
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Create: RequestHandler = async (req, res) => {
  try {
    const data = await Product.create(req.body);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Update: RequestHandler = async (req, res) => {
  try {
    const data = await Product.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Delete: RequestHandler = async (req, res) => {
  try {
    const data = await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export { Get_All, Get_One, Create, Update, Delete };
