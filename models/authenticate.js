const bcrypt = require('bcrypt');
const {db} = require("../config/firebaseconfig");
const customerRef = db.collection("registered users");

async function check(number, pass){
    const doc = customerRef.doc(number);
    const docSnapshot = await doc.get();
    if(!docSnapshot.exists){
        return 2;
    }
    const data = docSnapshot.data();
    const isMatch = await bcrypt.compare(pass, data["password"]);
    
    if(isMatch){
        return 1;
    }
    return 0;
}

module.exports = check;
