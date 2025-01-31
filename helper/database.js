const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db; //underscore znaci samo da je lokalna varijabla necemo je nigdje drugo koristiti, moze i bez toga

const mongoConnect = async (callback) => {
  try {
    // const encodedPassword = encodeURIComponent(process.env.MONGO_PASSWORD);
    const client = await MongoClient.connect(
      "mongodb+srv://sristic01:stefo1@cluster0.q9meq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Uspjesna konekcija!");
    _db = client.db("shop"); //moze i u url prije ?
    callback();
  } catch (error) {
    console.log("Greska pri konekciji: ", error);
    throw error;
  }
};

const getDb = () => {
  if (_db) return _db;
  throw "No database found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
