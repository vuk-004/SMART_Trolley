const {db} = require("../config/firebaseconfig.js")
const customerRef = db.collection("ongoing shopping data");
const balanceRef = db.collection("registered users");
const historyRef = db.collection("transaction history");

async function checkout(number, data){
    const balance = data["Total"];
    const balanceDoc = balanceRef.doc(number);
    const balanceSnapshot = (await balanceDoc.get()).data();
    
    if(balanceSnapshot["balance"]<balance){
        return 0;
    }

    balanceDoc.update({
        balance : balanceSnapshot["balance"]-balance
    });

    try{
        await customerRef.doc(number).delete();
    }catch (error) {
        console.error(`Error removing document: ${error}`);
    }

    const historyCol = historyRef.doc(number).collection("history");
    const now = new Date();
    const dateTimeString = now.toString();

    historyCol.doc(dateTimeString).set(data);
    return 1;
}

module.exports = checkout;