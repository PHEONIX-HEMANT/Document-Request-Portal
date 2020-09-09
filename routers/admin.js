const admin = require('express').Router()
const multer = require('multer')
const fs = require('fs')

const middlewares = require('../utils/middlewares')
const database = require("../database/database")
const helpers = require("../utils/helper")


admin.use('/', middlewares.is_admin);



admin.post('/approve', async function (req, res) {

    const upload = multer({ storage: helpers.storage, fileFilter: helpers.docFilter }).single('certificate')


    upload(req, res, async function (err) {
        if (err) {
            console.log(err)
            return res.status(400).json({ 'message': req.fileValidationError });
        }
        else {
            let { certificate_id, comments } = req.body;
            let rollno = req.jwt_payload.username;
            let flag = await helpers.approve_decline_rights(req, res, certificate_id);

            if (req.file) {
                let { filename } = req.file;
                let filepath = req.file.path;
                let initial_dest = appRoot + '/' + filepath;
                if (!flag) {
                    fs.unlinkSync(initial_dest);
                    return;
                }
                else {
                    let status = rollno + "@nitt.edu APPROVED";
                    try {
                        let row = await database.Certificate.findOne({
                            attributes: ['file', 'applier_roll'],
                            where: {
                                id: certificate_id,
                            }
                        })
                        let old_filename = row.getDataValue('file');
                        let applier_roll = row.getDataValue('applier_roll');
                        let final_dest = appRoot + "/uploads/" + applier_roll + '/' + filename;
                        try {
                            fs.unlinkSync(appRoot + "/uploads/" + applier_roll + '/' + old_filename);
                            helpers.renameFile(initial_dest, final_dest);
                        }
                        catch (err) {
                            fs.unlinkSync(initial_dest);
                            console.log(err);
                            res.json(500).json({ 'message': "Some problem with the file upload" });
                            // fs.unlinkSync(final_dest);
                            return;

                        }
                        await database.Certificate.update({ file: filename, status }, {
                            where: {
                                id: certificate_id
                            }
                        });

                        // PROCESS FILE
                    }
                    catch (err) {
                        console.log(err);
                        fs.unlinkSync(initial_dest);
                        res.json(500).json({ 'message': "Some problem with the file upload" });
                        return;

                    }
                }
            }
            await database.CertificatePaths.update({ status: 'APPROVED', comments }, {
                where: {
                    certificate_id,
                    path_email: rollno + "@nitt.edu"
                }
            })
            await database.History.create({ certificate_id, status: rollno + "@nitt.edu APPROVED", time: new Date(Date.now()).toISOString() })
            res.status(200).json({ 'message': "Approved successfully" });
        }


    })

});

admin.post('/decline', multer().none(), async function (req, res) {
    let { certificate_id, comments } = req.body;
    let rollno = req.jwt_payload.username;
    let flag = await helpers.approve_decline_rights(req, res, certificate_id);
    if (flag) {
        try {
            let status = rollno + "@nitt.edu DECLINED";
            await database.Certificate.update({ status }, {
                where: {
                    id: certificate_id
                }
            });
            await database.CertificatePaths.update({ status: 'DECLINED', comments }, {
                where: {
                    certificate_id,
                    path_email: rollno + "@nitt.edu"
                }
            })
            await database.History.create({ certificate_id, status, time: new Date(Date.now()).toISOString() })
            res.status(200).json({ 'message': "Declined successfully" });

        }
        catch (err) {
            console.log(err);
            res.status(500).json({ 'message': "There was some error declining the file. Try again later" });

        }

    }
})

admin.get("/", async function (req, res) {
    try {
        let rollno = req.jwt_payload.username;


        // find all ids for which dude is the admin
        let path_details = await database.CertificatePaths.findAll({
            attributes: ['certificate_id', 'path_no', 'status'],
            where: {
                path_email: rollno + '@nitt.edu',
                status: 'PENDING'
            }
        });
        let path_objects = []
        path_details.forEach(function (ele) {
            let path_no = ele.getDataValue('path_no');
            let certificate_id = ele.getDataValue('certificate_id');
            let status = ele.getDataValue('status')
            path_objects.push({
                path_no, certificate_id, status
            })
        })
        let response_json = []
        for (const index in path_objects) {
            let path_object = path_objects[index];
            let { path_no, certificate_id, status } = path_object;

            if (path_no == 1 && status === 'PENDING') {
                const ele = await database.Certificate.findOne({
                    attributes: ['applier_roll', 'type'],
                    where: {
                        id: certificate_id
                    }
                })
                response_json.push({
                    applier_roll: ele.getDataValue('applier_roll'),
                    certificate_type: ele.getDataValue('type'),
                    certificate_id,
                    status
                })
            }
            else if (path_no != 1) {
                const row = await database.CertificatePaths.findOne({
                    where: {
                        path_no: path_no - 1,
                        status: 'APPROVED',
                        certificate_id,
                    }
                });
                if (row != null) {
                    const ele = await database.Certificate.findOne({
                        attributes: ['applier_roll', 'type'],
                        where: {
                            id: certificate_id
                        }
                    })
                    response_json.push({
                        applier_roll: ele.getDataValue('applier_roll'),
                        certificate_type: ele.getDataValue('type'),
                        certificate_id,
                        status
                    })
                }

            }

        }
        res.status(200).json(response_json);
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ 'message': 'Some issue with the server. Try again later' })
    }

});

module.exports = admin;