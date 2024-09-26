import express from 'express';
import multer from 'multer';
import request from 'supertest';
import {
  deleteImage,
  uploadImages,
  uploadMultiple,
} from '../../src/controllers/upload.controller';
const app = express();

const upload = multer();

app.post('/upload', upload.single('upload'), uploadImages);
app.post('upload/multiple', upload.array('upload'), uploadMultiple);
app.delete('/upload/:publicId', deleteImage);

jest.mock('../../src/configs/cloudinaryConfig.ts', () => ({
  handleUpload: jest.fn().mockReturnValue({
    _url: 'http://example.com/image.jpg',
    public_id: 'sample_id',
  }),
  handleDelete: jest.fn().mockResolvedValue(true),
}));
describe('Upload controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
});

import { handleDelete, handleUpload } from '../mocks/mockCloudinary';

test('Should upload a single image', async () => {
  const file = Buffer.from('sample image data');

  const res = await request(app)
    .post('/upload')
    .attach('file', file, 'image.url');

  expect(res.status).toBe(200);
  expect(res.body.messagesSuccess).toBe('Update images successfully!');
  expect(handleUpload).toHaveBeenCalled();
});

test('Should return 400 if no file is uploaded', async () => {
  const res = await request(app).post('/upload');

  expect(res.status).toBe(400);
  expect(res.body.messageError).toBe('Bad request');
});

test('Should upload multiple images', async () => {
  const files = [
    Buffer.from('images data 1'),
    Buffer.from('images data 2'),
    Buffer.from('images data 3'),
  ];
  const res = await request(app)
    .post('/upload/multiple')
    .attach('files', files[0], 'image1.jpg')
    .attach('files', files[1], 'image2.jpg');

  expect(res.status).toBe(200);
  expect(res.body.messagesSuccess).toBe('Update images successfully!');
  expect(handleUpload).toHaveBeenCalledTimes(2);
});
test('Should return 400 if no files is uploaded', async () => {
  const res = await request(app).post('/upload/multiple');

  expect(res.status).toBe(400);
  expect(res.body.messageError).toBe('Bad request');
});

test('Should delete an image', async () => {
  const res = await request(app).delete('/upload/sample_id');

  expect(res.status).toBe(200);
  expect(res.body.messagesSuccess).toBe('Delete images successfully!');
  expect(handleDelete).toHaveBeenCalledWith('sample_id');
});