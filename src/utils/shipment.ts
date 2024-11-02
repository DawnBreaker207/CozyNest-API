import axios from 'axios';
import { DISTRICT_ID, SHIPMENT_SHOP, TOKEN_SHIPMENT, WARD_CODE } from './env';
import logger from './logger';
import { AppError } from './errorHandle';
import { StatusCodes } from '@/http-status-codes/build/cjs';


// Khai báo kiểu cho phản hồi từ API của GHN
interface Province {
  ProvinceID: number;
  NameExtension: string[];
}

interface District {
  DistrictID: number;
  DistrictName: string;
}

interface Ward {
  WardCode: string;
  WardName: string;
}

// Kiểu dữ liệu cho kết quả trả về
interface AddressLocation {
  ward_code: string;
  district: District;
}

/**
 *
 * @param location
 * @returns
 */
const getAddressLocation = async (
  location: string,
): Promise<AddressLocation | undefined> => {
  try {
    let ward_code: string = WARD_CODE as string;
    let district_id: number = parseInt(DISTRICT_ID as string);

    const provinces = await axios.get<Province[]>(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province',
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          'Content-Type': 'application/json',
        },
      },
    );

    const provinces_id = provinces.data.find((item) => {
      return item.NameExtension.includes(location.split(',')[2].trim());
    });

    const districts = await axios.post<{ data: District[] }>(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district',
      {
        provinces_id: provinces_id?.ProvinceID,
      },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          'Content-Type': 'application/json',
        },
      },
    );

    const district = districts.data.data.find(
      (item) => item.DistrictName == location.split(',')[1].trim(),
    );
    if (!district) {
      logger.log('error', 'Get address location errors: District not found');
      throw new AppError(StatusCodes.NOT_FOUND, 'District not found');
    }
    district_id = district.DistrictID;

    const wards = await axios.post<{ data: Ward[] }>(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id',
      {
        district_id: district_id,
      },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          'Content-Type': 'application/json',
        },
      },
    );

    const ward = wards.data.data.find(
      (item) => item.WardName == location.split(',')[0].trim(),
    );
    if (!ward) {
      logger.log('error', 'Get address location errors : Ward not found');
      throw new AppError(StatusCodes.NOT_FOUND, 'Ward not found');
    }
    ward_code = ward.WardCode;

    return {
      ward_code,
      district,
    };
  } catch (error) {
    logger.log('error', `Catch errors get address location : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when get address location' + error,
    );


  }
};

/**
 *
 * @param order_code
 * @returns
 */
const getOrderInfo = async (order_code: string) => {
  try {
    const order_info = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail',
      { order_code },
      {
        headers: { Token: TOKEN_SHIPMENT },
      },
    );
    return order_info.data;
  } catch (error) {
logger.log('error', `Catch errors get order info : ${error}`);
    throw new AppError(StatusCodes.BAD_REQUEST,'Can not get order info' + error,
    );

  }
};

/**
 *
 * @param order_code
 * @returns
 */
const cancelledOrder = async (order_code: string) => {
  try {
    const order_info = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel',
      { order_code: [order_code] },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          ShopId: SHIPMENT_SHOP,
        },
      },
    );
    return order_info;
  } catch (error) {
    logger.log('error', `Catch errors cancelled order : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when cancel order ' + error,
    );

  }
};

/**
 *
 * @param info
 * @returns
 */
const updateInfo = async (info: string[]) => {
  try {
    const order_info = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/update',
      { ...info },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          ShopId: SHIPMENT_SHOP,
        },
      },
    );
    return order_info.data;
  } catch (error) {

    logger.log('error', `Catch errors update info : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when update info' + error,
    );


  }
};

/**
 *
 * @param info
 * @returns
 */
const calculateTime = async (info: string[]) => {
  try {
    const expected_time = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/leadtime',
      { ...info },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          ShopId: SHIPMENT_SHOP,
        },
      },
    );

    return expected_time.data;
  } catch (error) {

logger.log('error', `Catch errors calculate time : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when calculate time' + error,
    );


  }
};

/**
 *
 * @param location
 * @returns
 */
const calculateFee = async (location: string[]) => {
  try {
    const calculate = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
      { ...location },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          ShopId: SHIPMENT_SHOP,
        },
      },
    );
    return calculate.data;
  } catch (error) {
    logger.log('error', `Catch errors calculate fee : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when calculate fee' + error,
    );


  }
};

/**
 *
 * @param order_code
 * @returns
 */
const getTokenPrintBill = async (order_code: string) => {
  try {
    const print_bill = await axios.post(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/a5/gen-token',
      { order_code: [order_code] },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
        },
      },
    );
    return print_bill.data;
  } catch (error) {

    logger.log('error', `Catch errors get token print bill : ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problems when get token print bill' + error,
    );


  }
};

export {
  getAddressLocation,
  getOrderInfo,
  cancelledOrder,
  updateInfo,
  calculateTime,
  calculateFee,
  getTokenPrintBill,
};
