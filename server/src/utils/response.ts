interface FileItem {
  url: string;
  name: string;
}

type ConversionSuccessResponse = {
  success: true;
  files: [FileItem, ...FileItem[]];
};

type ConversionErrorResponse = {
  success: false;
  error: string;
};

type SendResponseOptions =
  | {
      status: 200;
      body: ConversionSuccessResponse;
    }
  | {
      status: 400 | 500;
      body: ConversionErrorResponse;
    };

interface ResponseWriter {
  status(statusCode: number): ResponseWriter;
  json(body: ConversionSuccessResponse | ConversionErrorResponse): unknown;
}

const sendResponse = (res: ResponseWriter, options: SendResponseOptions) => {
  return res.status(options.status).json(options.body);
};

export const sendSuccessResponse = (
  res: ResponseWriter,
  files: [FileItem, ...FileItem[]],
) => {
  return sendResponse(res, {
    status: 200,
    body: {
      success: true,
      files,
    },
  });
};

export const sendErrorResponse = (
  res: ResponseWriter,
  status: 400 | 500,
  error: string,
) => {
  return sendResponse(res, {
    status,
    body: {
      success: false,
      error,
    },
  });
};

export const createOutputFileItem = (name: string): FileItem => ({
  url: `/output/${name}`,
  name,
});
