const { response } = require('express')

const bcrypt = require('bcryptjs');

const findUserByEmail = (req, res = response) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const email = req.params.email;
        conn.query(`select * from user where email = ?`, [email], (err, rows) => {
            if (err) return res.send(err);
            res.json(rows)
        })
    })
}

const createUser = async (req, res) => {
    req.getConnection(async (err, conn) => {
        if (err) return res.send(err);
        const { name, lastName, email, password, phoneNumer } = req.body;
        const user = {
            name,
            last_name: lastName,
            email,
            password,
            phone_number: phoneNumer
        }
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(password, salt);
        conn.query(`select * from user where email = ?`, [user.email], (err, rows,) => {
            if (err) return res.send(err);

            if (rows.length) {
                res.json({
                    error: {
                        value: `email=${user.email}`,
                        msg: `El email ${user.email} ya esta registrado.`,
                        param: "email",
                        location: "body"
                    }
                });
            } else {
                conn.query('insert into user set ?', user, (err, rows) => {
                    if (err) return res.send(err);

                    res.json({ status: 'success',
                                id:rows.insertId
                })
                })
            }
        })
    })
}

const login = async (req, res) => {
    req.getConnection(async (err, conn) => {
        if (err) return res.send(err);
        const {  email, password } = req.body;
        
        conn.query(`select * from user where email = ? `, [email], (err, rows) => {
            if (err) return res.send(err);
            if (rows.length!==0) {
                const verified =   bcrypt.compareSync(password,rows[0].password)
                if(verified){
                    res.json({ status: 'success' })
                }else{
                    res.json({
                        error: {
                            value: `email=${email}, password=${password}`,
                            msg: `Usuario o contraseña incorrecta, vuelva a intentarlo.`,
                            param: "email,password",
                            location: "body"
                        }
                    });
                }
            } else {
                res.json({
                    error: {
                        value: `email=${email}, password=${password}`,
                        msg: `El usuario no se encuentra registrado`,
                        param: "email,password",
                        location: "body"
                    }
                });
            }
        })
        /**
         * {
            "fieldCount": 0,
            "affectedRows": 1,
            "insertId": 3,
            "serverStatus": 2,
            "warningCount": 0,
            "message": "",
            "protocol41": true,
            "changedRows": 0
        }
         */
    })
}

module.exports = {
    createUser,
    findUserByEmail,
    login
}