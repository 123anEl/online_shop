const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
     productname: {
        type: String, required: true 
     },
     description: {
        type: String, required: true
     },
    price: {
        type: Number, required: true
    },
    quantity: {
        type: String, required: true
    },
    imgLink: {
        type: String, required: true
    }
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("Product", ProductSchema);