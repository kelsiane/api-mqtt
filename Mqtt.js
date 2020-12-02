var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const mqtt = require('mqtt');

const MongoClient = require('mongodb').MongoClient
const uri = "mongodb+srv://kelsiane:96881554@cluster0.tx1ym.mongodb.net/banco?retryWrites=true&w=majority";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
  if (err) {
    return console.log(err)
  } else {
    console.log('conectado no Mongo!!')
  }
  db = client.db('banco') // coloque o nome do seu DB

  var server = app.listen(3000, function () {
    console.log("app running on port.", server.address().port);
  });
})

// Credenciais MQTT

var mqttClient = null;
var host = 'mqtt://test.mosquitto.org';
var username = null;
var password = null;

function connect() {
  // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
  mqttClient = mqtt.connect(host, { username: username, password: password });

  // Mqtt error calback
  mqttClient.on('error', (err) => {
    console.log(err);
    mqttClient.end();
  });

  // Connection callback
  mqttClient.on('connect', () => {
    console.log(`mqtt client connected`);
  });


  mqttClient.on('close', () => {
    console.log(`mqtt client disconnected`);
  });

}

connect();


function sendMessage(message) {
  mqttClient.publish(topic, message);
}


function receiveMessage(topic) {
  mqttClient.subscribe(topic, { qos: 0 });
  mqttClient.on('message', function (topic, message, packet, res, req) {
    //console.log("Received '" + message + "' on '" + topic + "'");
    description = packet.topic;
    dados = JSON.parse(message);
    collection.insertMany([
      { "value": dados, "topic": description }
    ])
  });
}
 
async function removeBD(collection_) {
  var dadosCollection = await db.collection(collection_).find().count();
  console.log(dadosCollection)
  if(dadosCollection >= 27){
    db.collection(collection_).deleteMany();
  }
}

// Routes

app.post("/send-mqtt", function (req, res) {
  var topic = null; //defina o topico que quer enviar mensagem
  sendMessage(topic, req.body.temperatura);
  res.status(200).send("Message sent to mqtt");

});

app.get('/tempObjeto', async function (req, res) {
  receiveMessage('kelsiane/tempObjeto');
  collection = await db.collection('tempObjeto');
  // Find some documents
  collection.find().limit(2).sort({ _id: -1 }).toArray(function (err, docs) {
    console.log(docs)
    res.send(docs)
  });
})

app.get('/', function (req, res) {
  removeBD('teste');
  res.send("ok")
})
app.get("/tempAmbiente", async function (req, res) {
  receiveMessage('kelsiane/tempAmbiente');
  collection = await db.collection('tempAmbiente');
  collection.find().limit(5).sort({ _id: -1 }).toArray(function (err, docs) {
    res.send(docs)
  });
})