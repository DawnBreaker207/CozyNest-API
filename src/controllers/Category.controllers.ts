import { RequestHandler } from 'express';
import Category from '../models/Category';

const Get_All: RequestHandler = async (req, res) => {
  try {
    const data = await Category.find().populate('product');
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Get_One: RequestHandler = async (req, res) => {
  try {
    const data = await Category.findById(req.params.id).populate('product');
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Update: RequestHandler = async (req, res) => {
  try {
    const data = await Category.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Delete: RequestHandler = async (req, res) => {
  try {
    const data = await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const Create: RequestHandler = async (req, res) => {
  try {
    const data = await Category.create(req.body);
    res.status(200).json({
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
export { Get_All, Get_One, Create, Update, Delete };
