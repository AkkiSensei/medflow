package com.hospital.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is mandatory")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank(message = "Last name is mandatory")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Min(value = 0, message = "Age cannot be negative")
    private int age;

    @NotNull(message = "Gender is mandatory")
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @NotNull(message = "Ward is mandatory")
    @Enumerated(EnumType.STRING)
    private Ward ward;

    @NotNull(message = "Admission date is mandatory")
    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @NotNull(message = "Status is mandatory")
    @Enumerated(EnumType.STRING)
    private PatientStatus status;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    @Column(length = 500)
    private String reason;

    public Patient() {
    }

    public Patient(String firstName, String lastName, int age, Gender gender, Ward ward, LocalDate admissionDate, PatientStatus status, String reason) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
        this.gender = gender;
        this.ward = ward;
        this.admissionDate = admissionDate;
        this.status = status;
        this.reason = reason;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public Ward getWard() {
        return ward;
    }

    public void setWard(Ward ward) {
        this.ward = ward;
    }

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public PatientStatus getStatus() {
        return status;
    }

    public void setStatus(PatientStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}