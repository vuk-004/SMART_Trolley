const {db} = require("../config/firebaseconfig.js")
const price = require("./prices");
const customerRef = db.collection("ongoing shopping data");
const balanceRef = db.collection("registered users");

class Kart {
    constructor(number) {
        this.number = number;
    }

    async addItem(itemName, quantity) {
        const doc = customerRef.doc(this.number);
        const docSnapshot = await doc.get();
        let x = Number(quantity);

        if (!docSnapshot.exists) {
            await doc.set({ [itemName]: x }, { merge: true });
        } else {
            const data = docSnapshot.data();
            x += data[itemName] ? Number(data[itemName]) : 0;
            await doc.update({ [itemName]: x });
        }
    }

    async deleteItem(itemName) {
        const doc = customerRef.doc(this.number);
        const docSnapshot = await doc.get();
        const data = docSnapshot.data();
        if (data[itemName] <= 1) {
            await doc.update({ [itemName]: admin.firestore.FieldValue.delete() });
        } else {
            await doc.update({ [itemName]: data[itemName] - 1 });
        }
    }

    async registerUser(email, username, password, initialBalance) {
        const userDoc = balanceRef.doc(this.number);
        await userDoc.set({
            email,
            username,
            balance: initialBalance,
            password
        });
    }

    async getItems() {
        const doc = customerRef.doc(this.number);
        const docSnapshot = await doc.get();
        const data = docSnapshot.data();
        let total = 0;
        for (const [key, value] of Object.entries(data)) {
            total += (price[key] || 0) * value;
        }
        data.Total = total;
        return data;
    }

    async getBalance() {
        const balanceDoc = balanceRef.doc(this.number);
        const balanceSnapshot = await balanceDoc.get();
        return balanceSnapshot.data().balance;
    }

    async getUserData() {
        const userDoc = balanceRef.doc(this.number);
        try {
            const doc = await userDoc.get();
            if (doc.exists) {
                return doc.data();
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }

    async  getTransactions() {
    try {
        const transactionsRef = db.collection('transaction history').doc(this.number).collection('history');
        const snapshot = await transactionsRef.get();

        if (snapshot.empty) {
            throw new Error('No transactions found');
        }

        const transactions = {};

        snapshot.forEach(doc => {
            const date = doc.id;
            const items = doc.data();

            const itemArray = Object.entries(items).map(([itemName, quantity]) => ({
                itemName,
                quantity
            }));

            transactions[date] = itemArray;
        });

        return transactions;
    } catch (error) {
        throw new Error('Error fetching transactions: ' + error.message);
    }
}

    async addBalance(amount) {
        const userDoc = balanceRef.doc(this.number);
        const snapshot = await userDoc.get();

        if (!snapshot.exists) {
            throw new Error("User not found");
        }

        const currentBalance = snapshot.data().balance || 0;
        const newBalance = currentBalance + Number(amount);

        await userDoc.update({ balance: newBalance });
        return newBalance;
    }


    async updateUsername(newUsername) {
    const userDoc = balanceRef.doc(this.number);
    const snapshot = await userDoc.get();
    if (!snapshot.exists) {
        throw new Error("User not found");
    }
    await userDoc.update({ username: newUsername });
    return true;
}

async updatePassword(hashedPassword) {
    const userDoc = balanceRef.doc(this.number);
    const snapshot = await userDoc.get();
    if (!snapshot.exists) {
        throw new Error("User not found");
    }
    await userDoc.update({ password: hashedPassword });
    return true;
}


}

module.exports = Kart;
