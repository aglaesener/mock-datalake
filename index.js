const express = require("express");
const app = express();

// Connection pool basato su db.js:
const pool = require("./db");

app.use(express.json()) // => req.body

// ROUTES

// create a patient
app.post("/patients", async(req,res) => {
    try{
        // await
        body_patient = req.body["patient"];
        const newPatient = await pool.query("\
        INSERT INTO Patient\
        (first_name, last_name, patient_id, sex, birth_year_month)\
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT (patient_id) DO NOTHING RETURNING *",
        [body_patient["firstName"],
        body_patient["lastName"],
        body_patient["id"],
        body_patient["sex"],
        body_patient["birthYearMonth"],]
        );

        res.json(newPatient.rows[0]);
    }
    catch(err){
        console.error(err.message)
    }
})

// get all patients
app.get("/patients", async(req,res) => {
    try {
        const allPatients = await pool.query("\
        SELECT * FROM Patient");

        res.json(allPatients.rows);
    } catch (err) {
        console.error(err.message)        
    }
})

// get a patient
app.get("/patients/:id", async(req,res) => {
    try {
        const {id} = req.params;
        const patient = await pool.query("\
        SELECT * FROM Patient WHERE patient_id = $1", [id]);

        res.json(patient.rows[0]);
    } catch (err) {
        console.error(err.message)
    }
})

// update a patient
app.put("/patients/:id", async(req,res) => {
    try {
        const {id} = req.params; // WHERE
        const body_patient = req.body["patient"]; // SET
        const updatePatient = await pool.query("\
        UPDATE Patient SET\
        first_name=$2, last_name=$3, patient_id=$4, sex=$5, birth_year_month=$6\
        WHERE patient_id = $1",
        [
            id,
            body_patient["firstName"],
            body_patient["lastName"],
            body_patient["id"],
            body_patient["sex"],
            body_patient["birthYearMonth"]
        ]
        );
        res.json("Patient updated!");
    } catch (err) {
        console.error(err.message)
    }
})

// delete a patient
app.delete("/patients/:id", async(req,res) => {
    try {
        const {id} = req.params; // WHERE
        const deletePatient = await pool.query("\
        DELETE FROM Patient \
        WHERE patient_id = $1",
        [id]
        );
        res.json("Patient deleted!");
    } catch (err) {
        console.error(err.message)
    }
})

// delete all patients
app.delete("/patients", async(req,res) => {
    try {
        const deletePatients = await pool.query("\
        DELETE FROM Patient"
        );
        res.json("All patients deleted!");
    } catch (err) {
        console.error(err.message)
    }
})

// create a document
app.post("/documents", async(req,res) => {
    try{
        // await
        body_patient = req.body["patient"];
        body_provenance = req.body["provenance"];
        body_clinical_data = req.body["clinicalData"];

        body_doc_id = req.body["id"];
        body_doc_source = req.body["source"];

        console.log();

        // === PATIENT ===
        var new_patient_query = `\
        INSERT INTO Patient \
        (first_name, last_name, patient_id, sex, birth_year_month) \
        VALUES (\'${body_patient["firstName"]}\', \
                \'${body_patient["lastName"]}\', \
                \'${body_patient["id"]}\', \
                \'${body_patient["sex"]}\', \
                \'${body_patient["birthYearMonth"]}\') \
        ON CONFLICT (patient_id) DO NOTHING RETURNING *;`.replace(/\s+/g, ' ');

        console.log("new_patient_query:");
        console.log(new_patient_query);
        
        const newPatient = await pool.query(new_patient_query, []);

        console.log("newPatient.rows:");
        console.log(newPatient.rows);
        console.log();

        var id_patient = await pool.query("SELECT id FROM Patient WHERE patient_id=$1", [body_patient["id"]]);
        id_patient = id_patient.rows[0].id;

        // === DOCUMENT ===

        var new_document_query = `\
        INSERT INTO Document \
        (document_id, patient, source) \
        VALUES (\'${body_doc_id}\', ${id_patient}, \'${body_doc_source}\') \
        ON CONFLICT (document_id) DO NOTHING RETURNING *;`.replace(/\s+/g, ' ');

        console.log("new_document_query:");
        console.log(new_document_query);

        const newDocument = await pool.query(new_document_query, []);

        console.log("newDocument.rows:");
        console.log(newDocument.rows);
        console.log();

        var id_document = await pool.query("SELECT id FROM Document WHERE document_id=$1", [body_doc_id]);
        id_document = id_document.rows[0].id;

        // === PROVENANCE ===

        var new_provenance_query = `\
        INSERT INTO Provenance \
        (provenance_id) \
        VALUES (\'${body_provenance["id"]}\') \
        ON CONFLICT (provenance_id) DO NOTHING RETURNING *;`.replace(/\s+/g, ' ');

        console.log("new_provenance_query:");
        console.log(new_provenance_query);

        const newProvenance = await pool.query(new_provenance_query, []);

        console.log("newProvenance.rows:");
        console.log(newProvenance.rows);
        console.log();

        var id_provenance = await pool.query("SELECT id FROM Provenance WHERE provenance_id=$1", [body_provenance["id"]]);
        id_provenance = id_provenance.rows[0].id;

        // === CLINICAL DATA ===

        var arr_clinicaldata = [];
        for (data of body_clinical_data) {

            cd_id              = data["id"];
            cd_doc_type        = data["docType"];
            cd_type            = data["type"];
            cd_label           = data["label"];
            cd_value           = data["value"];
            cd_unit            = data["unit"];
            cd_coding_system   = data["codingSystem"];
            cd_code            = data["code"];
            cd_date            = data["date"];
            cd_time            = data["time"];
            cd_dose            = data["dose"];
            cd_admin_route     = data["adminRoute"];
            cd_daily_frequence = data["dailyFrequence"];
            cd_date_end        = data["dateEnd"];
            cd_time_end        = data["timeEnd"];
            cd_note            = data["note"];

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
            
            console.log("new_clinicaldata_query:");
            console.log(new_clinicaldata_query);

            const newClinicalData = await pool.query(new_clinicaldata_query, []);

            console.log("newClinicalData.rows:");
            console.log(newClinicalData.rows);
            console.log();

            arr_clinicaldata.push(newClinicalData.rows[0]);
        }
            
        res.json(arr_clinicaldata);
    }
    catch(err){
        console.error(err.message)
    }
})

app.listen(5000, () => {
    console.log("server listening on port 5000");
});