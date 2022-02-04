-- CREATE DATABASE IF NOT EXISTS medas_datalake;

--\c medas_datalake

CREATE TABLE IF NOT EXISTS Patient (
	id SERIAL PRIMARY KEY,
	patient_id TEXT UNIQUE NOT NULL,
    first_name TEXT,
	last_name TEXT,
	sex TEXT,
	birth_year TEXT
);

CREATE TABLE IF NOT EXISTS Document (
    id SERIAL PRIMARY KEY,
    patient INT NOT NULL REFERENCES Patient (id) ON DELETE CASCADE,
    document_id TEXT UNIQUE NOT NULL,
    source TEXT,
    type TEXT,
    date TEXT,
    time TEXT
);

CREATE TABLE IF NOT EXISTS Provenance (
    id SERIAL PRIMARY KEY,
    provenance_id TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ClinicalData (
    id SERIAL PRIMARY KEY,
    patient INT REFERENCES Patient (id) ON DELETE CASCADE,
    document INT REFERENCES Document (id) ON DELETE CASCADE,
    provenance INT REFERENCES Provenance (id) ON DELETE CASCADE,
    clinical_data_id TEXT UNIQUE NOT NULL,
    doc_type TEXT,
    type TEXT,
    label TEXT NOT NULL,
    value TEXT,
    unit TEXT,
    coding_system TEXT,
    code TEXT,
    date DATE,
    time TIME,
    dose TEXT,
    admin_route TEXT,
    daily_frequence TEXT,
    date_end DATE,
    time_end TIME,
    note TEXT
);
