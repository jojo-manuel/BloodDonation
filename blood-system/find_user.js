const users = db.users.find({
    $or: [
        { name: /ab/i },
        { email: /ab/i }
    ]
}, { name: 1, email: 1, role: 1 }).toArray();
printjson(users);
