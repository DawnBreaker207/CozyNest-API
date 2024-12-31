import express from 'express';
import multer from 'multer';
import request from 'supertest';
import {
  deleteImage,
  uploadSingle,
  uploadMultiple,
} from '../../src/controllers/upload.controller';
import { handleDelete, handleUpload } from '../../src/configs/cloudinaryConfig';
import { messagesError, messagesSuccess } from '../../src/constants/messages';

const app = express();
const upload = multer();

app.post('/upload', upload.single('upload'), uploadSingle);
app.post('/upload/multiple', upload.array('upload'), uploadMultiple);
app.delete('/upload/:publicId', deleteImage);

// Mock Cloudinary functions
jest.mock('../../src/configs/cloudinaryConfig.ts', () => ({
  handleUpload: jest.fn().mockResolvedValue({
    url: 'http://example.com/image.jpg',
    public_id: 'sample_id',
  }),
  handleDelete: jest.fn().mockResolvedValue(true),
}));

describe('Upload controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Should upload a single image', async () => {
    const file = Buffer.from('sample image data');

    const res = await request(app)
      .post('/upload')
      .attach('upload', file, 'image.jpg');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(messagesSuccess.UPDATE_IMAGES_SUCCESS);
    expect(handleUpload).toHaveBeenCalled();
  });

  test('Should return 400 if no file is uploaded', async () => {
    const res = await request(app).post('/upload');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(messagesError.BAD_REQUEST);
  });

  test('Should upload multiple images', async () => {
    const files = [Buffer.from('images data 1'), Buffer.from('images data 2')];
    const res = await request(app)
      .post('/upload/multiple')
      .attach('upload', files[0], 'image1.jpg')
      .attach('upload', files[1], 'image2.jpg');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(messagesSuccess.UPDATE_IMAGES_SUCCESS);
    expect(handleUpload).toHaveBeenCalledTimes(2);
  });

  test('Should return 400 if no files are uploaded', async () => {
    const res = await request(app).post('/upload/multiple');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(messagesError.BAD_REQUEST);
  });

  test('Should delete an image', async () => {
    const res = await request(app).delete('/upload/sample_id');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(messagesSuccess.DELETE_IMAGES_SUCCESS);
    expect(handleDelete).toHaveBeenCalledWith('sample_id');
  });

  test('Basic test case', () => {
    expect(true).toBe(true);
  });
});
