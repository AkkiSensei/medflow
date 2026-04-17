# MedFlow

MedFlow is a hospital management web application built with **Java 17**, **Spring Boot**, **Spring Data JPA**, **Flyway**, **H2**, and a polished **HTML/CSS/JavaScript** frontend.

It is designed as a portfolio-style project to showcase strong Java backend development, layered architecture, database design, REST APIs, validation, exception handling, analytics, and an interactive frontend dashboard.

## Features

- Patient admission workflow
- Patient directory with search, ward filtering, and pagination
- Discharge workflow for admitted patients
- Dashboard analytics for occupancy and ward distribution
- Role-based login with doctor and staff profiles
- Appointment and doctor schedule module
- Global API error handling
- DTO-based API design
- Enum-based domain modeling
- Flyway database migrations
- Seeded demo patient data
- Frontend system lock / unlock screen

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Web
- Spring Data JPA
- Hibernate Validator
- Flyway
- H2 Database
- Maven
- HTML, CSS, JavaScript

## Project Structure

```text
src/main/java/com/hospital
|-- controller
|-- dto
|-- exception
|-- mapper
|-- model
|-- repository
|-- service

src/main/resources
|-- db/migration
|-- static
|-- application.properties
```

## Running the Project

### 1. Clone the repository

```bash
git clone https://github.com/AkkiSensei/medflow.git
cd medflow
```

### 2. Run with Maven

```bash
mvn spring-boot:run
```

Or run `HospitalApplication` directly from your IDE.

## Application URLs

- App UI: `http://localhost:8080`
- Patients API: `http://localhost:8080/api/patients`
- Search API: `http://localhost:8080/api/patients/search`
- Metrics API: `http://localhost:8080/api/patients/metrics`
- Appointments API: `http://localhost:8080/api/appointments`
- Schedule API: `http://localhost:8080/api/appointments/schedule`
- Login API: `http://localhost:8080/api/auth/login`
- H2 Console: `http://localhost:8080/h2-console`

## Demo Data

The app includes Flyway seed data with preloaded admitted and discharged patients.

If you restart the app, the in-memory H2 database is recreated and the seed data is loaded again.

## Example API Endpoints

### Get all patients

```http
GET /api/patients
```

### Search patients with pagination

```http
GET /api/patients/search?page=0&size=8&status=ADMITTED&ward=ICU&search=aarav
```

### Admit a patient

```http
POST /api/patients
Content-Type: application/json
```

```json
{
  "firstName": "Rahul",
  "lastName": "Verma",
  "age": 29,
  "gender": "MALE",
  "ward": "GENERAL",
  "reason": "High fever"
}
```

### Discharge a patient

```http
PATCH /api/patients/1/discharge
```

## Security Note

The frontend currently includes a demo lock screen with a client-side unlock code for showcase purposes. This is UI-only and not production security.

## Demo Login Credentials

- Doctor profile
  - Name: `Ritunjay Deo`
  - ID: `DOC-1001`
  - Password: `DocPass@123`
- Staff profile
  - Name: `Saanvi Chandel`
  - ID: `STF-2001`
  - Password: `StaffPass@123`

## Current Highlights

- Uses Java records for DTOs
- Uses enums for domain safety
- Uses JPA Specifications for dynamic filtering
- Uses streams and collectors for analytics
- Uses Flyway SQL migrations for schema and seed management

## Future Improvements

- Spring Security with role-based authentication
- JWT login system
- Doctor and appointment modules
- Export reports
- Automated tests
- Production database profile

## Author

Built by Ritunjay Deo as a Java full-stack portfolio project.
