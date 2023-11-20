mongoClient.connect(async function(error, mongo) {
  if(!error){
    // connection to DB
    console.log('connection is succesful');
    console.log(process.env)
    let db = mongo.db('RegistrationForm');
    let coll = db.collection('test');
    // get DB
    let res = await coll.find().toArray();
    let cnt = await coll.count();
    console.log(res);
  }
    /* / deletion from DB
    if(res != null){
      let mn = res[0].salary, id=0;
      for(let i = 0; i < cnt; i ++){
        if(mn > res[i].salary){
          mn = res[i].salary;
          id = i;
        }
      }
      coll.deleteOne({salary : mn}, function(err, obj) {
        if(err) console.log(err);
        console.log("deleted One with salary : mn");
      });
    }
    res = await coll.find().toArray();
    console.log("after deletion");
    console.log(res);
    //*/
/*/ adition to DB
    let obj = {name : "syrym", age : 180, salary : 1000}
    coll.insertOne(obj, function(err, res){
      if(err) console.log(err);
      console.log("added " + obj.name);
    });
  }else {
    console.log(err);
  }
  */
})
