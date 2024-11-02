export const mockFile = {
  name: 'test-image.jpg',
  path: 'path/to/test-image.jpg',
  size: 123456,
  type: 'image/jpeg',
};

export const mockUploadResponse = {
  public_id: 'test-id',
  url: 'http://mock-url.com/test-image.jpg',
  secure_url: 'https://mock-url.com/test-image.jpg',
};

export const mockUploadErrorResponse = {
  error: {
    message: 'Upload failed',
  },
};

export const mockDeleteResponse = {
  result: 'ok',
  msg: 'Deleted the image',
};

export const mockDeleteErrorResponse = {
  error: {
    message: 'Delete failed',
  },
};

export const handleUpload = jest.fn().mockReturnValue({
  _url: 'http://example.com/image.jpg',
  public_id: 'sample_id',
});
export const handleDelete = jest.fn().mockResolvedValue(true);

export const cloudinary = {
  uploader: {
    upload: jest.fn(),
  },
};
