/*
node -e '
const crypto = require("crypto");

// 1. Configura tus datos
const SECRET = "secret_super_seguro_123"; // El webhook_secret de tu tabla store_connections
const BUYER_EMAIL = "gustavo.proyectosweb@gmail.com"; // Debe ser tu email registrado en Resend
const EXTERNAL_PRODUCT_ID = "4321"; // El external_id de la tabla products

const payload = {
  id: Date.now(),
  email: BUYER_EMAIL,
  total_price: "25.00",
  currency: "USD",
  line_items: [
    {
      product_id: EXTERNAL_PRODUCT_ID
    }
  ]
};

const rawBody = JSON.stringify(payload);
const hmac = crypto.createHmac("sha256", SECRET).update(rawBody, "utf8").digest("base64");

fetch("http://localhost:3000/api/webhooks/shopify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-shopify-hmac-sha256": hmac
  },
  body: rawBody
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(result => console.log("\n📌 Respuesta del Webhook:\n", JSON.stringify(result, null, 2)))
.catch(err => console.error("❌ Error:", err));
'
*/




/*--------------------------------------------- */

//Opcion separada

/*
node -e '
const crypto = require("crypto");
const secret = "secret_super_seguro_123";
const body = JSON.stringify({
  id: 99990001,
  email: "gustavo.proyectosweb@gmail.com",
  total_price: "25.00",
  currency: "USD",
  line_items: [{ product_id: "1234" }]
});
const hmac = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
console.log("\nFirma generada:\n" + hmac + "\n");
'


0YAVo6BcjdK2+jIGr/VxBAHBFYH/CU/tQXG5Soj09LU=


curl -X POST http://localhost:3000/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: 0YAVo6BcjdK2+jIGr/VxBAHBFYH/CU/tQXG5Soj09LU=" \
  -d '{
    "id": 99990001,
    "email": "gustavo.proyectosweb@gmail.com",
    "total_price": "25.00",
    "currency": "USD",
    "line_items": [
      {
        "product_id": "1234"
      }
    ]
  }'
  */