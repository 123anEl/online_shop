const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
     name: {
        type: String, required: true 
     },
     age: {
        type: Number, required: true
     },
    email: {
        type: String, required: true, unique: true
    },
    city: {
        type: String, required: true
    },
    password: {
        type: String, required: true
    }
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("User", UserSchema);