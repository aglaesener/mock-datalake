const express = require("express")
const app = express()

require('log-timestamp')
const bp = require('body-parser')
const moment = require('moment')

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(express.json()) // => req.body

const basicAuth = require('express-basic-auth')

function replaceUndefined(vl){
    if(typeof(vl) === "undefined"){
        return ""; // return "" as replace, and end function execution
    } 
    return vl; // if the above state was false, functions continues and return original value
};

// Logs request content
function logreq(req) {
    const { rawHeaders, httpVersion, method, socket, url, body } = req
    const { remoteAddress, remoteFamily } = socket

    console.log("REQUEST [" + method + " " + url + "]:\n",
        JSON.stringify({
          rawHeaders,
          httpVersion,
          method,
          remoteAddress,
          remoteFamily,
          url,
          body
        }, null, 4)
      )
}

// Logs response
function logres(req, res, body) {

    res.json(body)
    const { method, url } = req
    const { statusCode, statusMessage } = res

    console.log(
        "RESPONSE [" + method + " " + url + "]: ",
        statusCode, "-", statusMessage, '\n',
        JSON.stringify(body, null, 4)
      )
}
 
app.use(basicAuth({
    users: { lakeuser: 'sys' },
    challenge: true // <--- needed to actually show the login dialog!
}));

// Connection pool basato su db.js:
const pool = require("./db");
const { rows } = require("pg/lib/defaults")

// ROUTES

// create a patient
app.post("/central/patients", async(req,res) => {

    logreq(req);
    try {
        const { firstName, lastName, id, sex, birthYear } = req.body["patient"]

        var query = `INSERT INTO Patient \
        (first_name, last_name, patient_id, sex, birth_year) \
        VALUES \
        ( \'${firstName}\', \'${lastName}\', \'${id}\', \'${sex}\', \'${birthYear}\') \
        ON CONFLICT (patient_id) DO NOTHING RETURNING *`.replace(/\s+/g, ' ')
        
        console.log(" => Executing query:\n", query)

        const newPatient = await pool.query(query, [])
        returnResp = {
            message: (newPatient.rowCount != 0) ? `Patient ${id} created!` : `Patient ${id} already exists.`,
            data: newPatient.rows[0]
        }
        logres(req, res, returnResp)
    }
    catch(err){
        console.error(err.message)
    }
})


// get all patients
app.get("/central/patients", async(req,res) => {

    logreq(req)
    try {
        var query = "SELECT * FROM Patient"

        console.log(" => Executing query:\n", query)

        const allPatients = await pool.query(query)
        returnResp = {
            message: (allPatients.rowCount != 0) ? `${allPatients.rowCount} patients found.` : `No patient found.`,
            data: allPatients.rows
        }
        logres(req, res, returnResp)
    } catch (err) {
        console.error(err.message)        
    }
})

// get a patient
app.get("/central/patients/:id", async(req,res) => {
    logreq(req)
    try {
        const { id } = req.params;
        var query = `SELECT * FROM Patient WHERE patient_id = \'${id}\'`.replace(/\s+/g, ' ')

        console.log(" => Executing query:\n", query)

        const patient = await pool.query(query, [])
        returnResp = {
            message: (patient.rowCount != 0) ? null : `Patient ${id} not found.`,
            data: patient.rows[0]
        }
        logres(req, res, returnResp)
    } catch (err) {
        console.error(err.message)
    }
})

// update a patient
app.put("/central/patients/:id", async(req,res) => {
    logreq(req)
    try {
        where_id = req.params["id"]; // WHERE
        const { firstName, lastName, id, sex, birthYear } = req.body["patient"]; // SET

        var query = `UPDATE Patient SET \
        first_name=\'${firstName}\', \
        last_name=\'${lastName}\', \
        patient_id=\'${id}\', \
        sex=\'${sex}\', \
        birth_year=\'${birthYear}\' \
        WHERE patient_id=\'${where_id}\' RETURNING *`.replace(/\s+/g, ' ')

        console.log(" => Executing query:\n", query)

        const updatePatient = await pool.query(query, [])
        returnResp = {
            message: (updatePatient.rowCount != 0) ? `Patient ${where_id} updated!` : `Patient ${where_id} not found.`,
            data: updatePatient.rows[0]
        }
        logres(req, res, returnResp)
    } catch (err) {
        console.error(err.message)
    }
})


// delete a patient
app.delete("/central/patients/:id", async(req,res) => {
    logreq(req)
    try {
        const where_id = req.params["id"]; // WHERE

        var query = `DELETE FROM Patient \
        WHERE patient_id = \'${where_id}\' RETURNING *;`.replace(/\s+/g, ' ');

        console.log(" => Executing query:\n", query)

        const deletePatient = await pool.query(query, [])
        returnResp = {
            message: (deletePatient.rowCount != 0) ? `Patient ${where_id} deleted!` : `Patient ${where_id} not found.`,
            data: deletePatient.rows
        }
        logres(req, res, returnResp)
    } catch (err) {
        console.error(err.message)
    }
})

// delete all patients
app.delete("/central/patients", async(req,res) => {
    logreq(req)
    try {
        var query = "DELETE FROM Patient RETURNING *;"
        const deletePatients = await pool.query(query, [])
        returnResp = {
            message: (deletePatients.rowCount != 0) ? `${deletePatients.rowCount} patients deleted!` : `No patient found.`,
            data: deletePatients.rows
        }
        logres(req, res, returnResp)
    } catch (err) {
        console.error(err.message)
    }
})

// create a document
app.post("/central/writeData", async(req,res) => {
    logreq(req)
    try {
        body_patient        = req.body["patient"];
        body_provenance     = req.body["provenance"];
        body_document       = req.body["document"];
        body_clinical_data  = req.body["clinicalData"];

        // === PATIENT ===
        var new_patient_query = `\
        INSERT INTO Patient \
        (patient_id, first_name, last_name, birth_year, sex) \
        VALUES (\'${body_patient["id"]}\', \
                \'${body_patient["firstName"]}\', \
                \'${body_patient["lastName"]}\', \
                \'${body_patient["birthYear"]}\', \
                \'${body_patient["sex"]}\') \
        ON CONFLICT (patient_id) DO NOTHING RETURNING *;`.replace(/\s+/g, ' ');

        console.log(" => Executing query:\n", new_patient_query)
        
        const newPatient = await pool.query(new_patient_query, [])

        select_patient_query = `SELECT id FROM Patient WHERE patient_id=\'${body_patient["id"]}\';`

        var id_patient = await pool.query(select_patient_query)
        id_patient = id_patient.rows[0].id

        // === DOCUMENT ===

        if (body_document) { // se body_document esiste

            bd_id       = replaceUndefined(body_document["id"])
            bd_source   = replaceUndefined(body_document["source"])
            bd_type     = replaceUndefined(body_document["type"])
            bd_date     = body_document["date"]
            if (!moment(bd_date).isValid()) {
                bd_date = '1000-01-01'
            }
            bd_time     = body_document["time"]
            if (!moment(bd_time, "hh:mm:ss").isValid()) {
                bd_time = '00:00:00'
            }


            var new_document_query = `\
            INSERT INTO Document \
            (document_id, patient, source, type, date, time) \
            VALUES (\'${bd_id}\', \
                    \'${id_patient}\',
                    \'${bd_source}\', \
                    \'${bd_type}\', \
                    \'${bd_date}\', \
                    \'${bd_time}\') \
            on conflict (document_id) \
            DO UPDATE SET (patient, source, type, date, time) \
            = ( \'${id_patient}\',
                \'${bd_source}\', \
                \'${bd_type}\', \
                \'${bd_date}\', \
                \'${bd_time}\') \
            RETURNING *;`.replace(/\s+/g, ' ')

        }
        else {
            new_document_query = `INSERT INTO Document \
            (patient) VALUES (\'${id_patient}\') RETURNING *;`
        }

        console.log(" => Executing query:\n", new_document_query)

        const newDocument = await pool.query(new_document_query, [])

        var id_document = newDocument.rows[0].id

        // === PROVENANCE ===

        var new_provenance_query = `\
        INSERT INTO Provenance \
        (provenance_id) \
        VALUES (\'${body_provenance["id"]}\') \
        ON CONFLICT (provenance_id) DO NOTHING RETURNING *;`.replace(/\s+/g, ' ');

        console.log(" => Executing query:\n", new_provenance_query)

        const newProvenance = await pool.query(new_provenance_query, []);

        var id_provenance = await pool.query("SELECT id FROM Provenance WHERE provenance_id=$1", [body_provenance["id"]]);
        id_provenance = id_provenance.rows[0].id;

        // === CLINICAL DATA ===

        var arr_clinicaldata = [];
        let i=0
        for (data of body_clinical_data) {

            console.log("\n\n  --- PING!! ---")
            console.log("i =", i, "\n\n")

            cd_id              = data["id"];
            cd_doc_type        = replaceUndefined(data["docType"]);
            cd_type            = replaceUndefined(data["type"]);
            cd_label           = replaceUndefined(data["label"]);
            cd_value           = replaceUndefined(data["value"]);
            cd_unit            = replaceUndefined(data["unit"]);
            cd_coding_system   = replaceUndefined(data["codingSystem"]);
            cd_code            = replaceUndefined(data["code"]);
            cd_date            = replaceUndefined(data["date"]);
            if (!moment(cd_date).isValid()) {
                cd_date = '1000-01-01'
            }
            cd_time            = data["time"];
            if (!moment(cd_time, "hh:mm:ss").isValid()) {
                cd_time = '00:00:00'
            }
            cd_dose            = replaceUndefined(data["dose"]);
            cd_admin_route     = replaceUndefined(data["adminRoute"]);
            cd_daily_frequence = replaceUndefined(data["dailyFrequence"]);
            cd_date_end        = replaceUndefined(data["dateEnd"]);
            cd_time_end        = replaceUndefined(data["timeEnd"]);
            cd_note            = replaceUndefined(data["note"]);

            var new_clinicaldata_query = `INSERT INTO ClinicalData \
                (patient, document, provenance, clinical_data_id,\
                    doc_type, type, label, value,\
                    unit, coding_system, code, date, time,\
                    dose, admin_route, daily_frequence, date_end, time_end, note) \
                VALUES \
                (${id_patient}, ${id_document}, ${id_provenance}, \'${cd_id}\', \
                    \'${cd_doc_type}\', \'${cd_type}\', \'${cd_label}\', \'${cd_value}\', \
                    \'${cd_unit}\', \'${cd_coding_system}\', \'${cd_code}\', \'${cd_date}\', \'${cd_time}\', \
                    \'${cd_dose}\', \'${cd_admin_route}\', \'${cd_daily_frequence}\', \'${cd_date_end}\', \
                    \'${cd_time_end}\', \'${cd_note}\') \
                ON CONFLICT (clinical_data_id) DO \
                UPDATE SET\
                (patient, document, provenance,\
                    doc_type, type, label, value,\
                    unit, coding_system, code, date, time,\
                    dose, admin_route, daily_frequence, date_end, time_end, note) =\
                (${id_patient}, ${id_document}, ${id_provenance}, \
                    \'${cd_doc_type}\', \'${cd_type}\', \'${cd_label}\', \'${cd_value}\', \
                    \'${cd_unit}\', \'${cd_coding_system}\', \'${cd_code}\', \'${cd_date}\', \'${cd_time}\', \
                    \'${cd_dose}\', \'${cd_admin_route}\', \'${cd_daily_frequence}\', \'${cd_date_end}\', \
                    \'${cd_time_end}\', \'${cd_note}\') \
                    WHERE ClinicalData.clinical_data_id=\'${cd_id}\' RETURNING *;`.replace(/\s+/g, ' ');
            
            console.log(" => Executing query:\n", new_clinicaldata_query)

            const newClinicalData = await pool.query(new_clinicaldata_query, [])
            arr_clinicaldata.push(newClinicalData.rows[0])
            i = i+1
        }

        returnResp = {
            message: `${arr_clinicaldata.length} clinical data created!`,
            data: arr_clinicaldata
        }
        logres(req, res, returnResp)
    }
    catch(err){
        console.error(err.message)
    }
})

app.listen(5000, () => {
    console.log("server listening on port 5000");
});