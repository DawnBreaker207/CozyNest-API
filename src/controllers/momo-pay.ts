import axios from "axios";
import * as crypto from 'crypto';
export const handleTransaction = async (req: any, res: any,next:any) => {
    //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
    //parameters
    const accessKey = 'F8BBA842ECF85';
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const orderInfo = 'pay with MoMo';
    const partnerCode = 'MOMO';
    const redirectUrl = 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xNT01PMTcyNzc2ODQzNTU0Mw&s=425503bbad6dda6a15a62bfa11d2a365def1511da16b47a6b3f70843760d3c1d';
    const ipnUrl = '   https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback';
    const requestType = 'payWithMethod';
    const amount = '1000';
    const orderId = `${partnerCode}${new Date().getTime()}`;
    const requestId = orderId;
    const extraData = '';
    const orderGroupId = '';
    const autoCapture = true;
    const lang = 'vi';

    //before sign HMAC SHA256 with format
    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    //puts raw signature
    console.log("--------------------RAW SIGNATURE----------------")
    console.log(rawSignature)
    //signature
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    console.log("--------------------SIGNATURE----------------")
    console.log(signature)

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature,
    });

    const options = {
        method: 'POST',
        url:'https://test-payment.momo.vn/v2/gateway/api/create',
        headers:{
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
        },
        data: requestBody

    }

    let result;
    try {
        result = await axios(options);
        return res.status(200).json(result.data);
    } catch (error) {
       return next(error);
    }
}

export const handleCallback =async (req: any, res: any) => {
    console.log("callback:");
    console.log(req.body);

    return res.status(200).json(req.body);
}


//kiểm tra trạng thái giao dịch
export const handleTransactionStatus = async (req: any, res: any, next: any) => {
    const { orderId } = req.body;
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'; 
    const accessKey = 'F8BBA842ECF85';
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

    const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

    const requestBody = JSON.stringify({
        orderId: orderId,
        partnerCode: 'MOMO',
        requestId: orderId,
        signature: signature,
        lang : 'vi',
    });

    //option for axios
    const options = {
        method: 'POST',
        url:'https://test-payment.momo.vn/v2/gateway/api/query',
        headers:{
            'Content-Type': 'application/json',
            
        },
        data: requestBody
    }

    let result = await axios(options);
    return res.status(200).json(result.data);
}