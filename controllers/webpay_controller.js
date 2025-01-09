const { ref, set, push, update } = require("firebase/database");
const { database: db } = require('../config/firebaseConfig'); // Ajusta la ruta según donde tengas tu firebaseConfig.js
const WebpayPlus = require("transbank-sdk").WebpayPlus;
const asyncHandler = require("../utils/async_handler");

const writeDudaData = async (body) => {
  const newDudaRef = push(ref(db, 'dudas')); // Genera un nuevo ID automáticamente

  let {
    titulo,
    duda,
    email,
    materia,
    metodo,
    recompensa,
    paid } = body;

  await set(
      newDudaRef, {
      titulo,
      duda,
      email,
      materia,
      metodo,
      recompensa,
      paid
  }
  );

  console.log(body,newDudaRef.key);
  return newDudaRef.key;
}

const setPaid = async (documentId) => {
  try {
    const dudaRef = ref(db, `dudas/${documentId}`); // Referencia al documento con el ID especificado

    await update(dudaRef, { paid: true }); // Actualiza solo el campo "paid" a true

    console.log(`El campo "paid" del documento con ID ${documentId} se ha actualizado a true.`);
  } catch (error) {
    console.error(`Error al actualizar el campo "paid" para el documento con ID ${documentId}:`, error);
  }
};

exports.create = asyncHandler(async function (request, response, next) {
    let body = request.body;

    const dudaKey = await writeDudaData(body);

    let buyOrder = "O-" + Math.floor(Math.random() * 10000) + 1;
    let sessionId = "S-" + Math.floor(Math.random() * 10000) + 1;
    let amount = Math.floor(Math.random() * 1000) + 1001;
    let returnUrl =
      request.protocol + "://" + request.get("host") + `/webpay_plus/commit`;
  
    const createResponse = await (new WebpayPlus.Transaction()).create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );
  
    let token = createResponse.token;
    let url = createResponse.url;
  
    let viewData = {
      buyOrder,
      sessionId,
      amount,
      returnUrl,
      token,
      url,
      dudaKey
    };

    console.log("res: ", viewData); 
    response.json(viewData);
  });

  exports.commit = asyncHandler(async function (request, response, next) {
    //Flujos:
    //1. Flujo normal (OK): solo llega token_ws
    //2. Timeout (más de 10 minutos en el formulario de Transbank): llegan TBK_ID_SESION y TBK_ORDEN_COMPRA
    //3. Pago abortado (con botón anular compra en el formulario de Webpay): llegan TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    //4. Caso atipico: llega todos token_ws, TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    console.log("================================================================================");
    console.log(request);
    console.log("================================================================================");
    let params = request.method === 'GET' ? request.query : request.body;
    let dudaKey = params.key;
    console.log("dudaKey commit: ", dudaKey);
    // TODO: puede que el cliente no esté enviando el parámetro o el servidor no lo está interpretando correctamente.
    let token = params.token_ws;
    let tbkToken = params.TBK_TOKEN;
    let tbkIdSesion = params.TBK_ID_SESION;
    
    let step = null;
    let stepDescription = null;
    let viewData = {
      token,
      tbkToken,
      //   tbkOrdenCompra,
      tbkIdSesion
    };
    
    if (token && !tbkToken) {//Flujo 1
      const commitResponse = await (new WebpayPlus.Transaction()).commit(token);
      viewData = {
        token,
        commitResponse,
      };
      
      response.json(viewData);
      console.log("params: ", params);
      
      setPaid(dudaKey);
      return;
    }
    else if (!token && !tbkToken) {//Flujo 2
      step = "El pago fue anulado por tiempo de espera.";
      stepDescription = "En este paso luego de anulación por tiempo de espera (+10 minutos) no es necesario realizar la confirmación ";
    }
    else if (!token && tbkToken) {//Flujo 3
      step = "El pago fue anulado por el usuario.";
      stepDescription = "En este paso luego de abandonar el formulario no es necesario realizar la confirmación ";
    }
    else if (token && tbkToken) {//Flujo 4
      step = "El pago es inválido.";
      stepDescription = "En este paso luego de abandonar el formulario no es necesario realizar la confirmación ";
    }
  
    response.render("webpay_plus/commit-error", {
      step,
      stepDescription,
      viewData,
    });
  });
  