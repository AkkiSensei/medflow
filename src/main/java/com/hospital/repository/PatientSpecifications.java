package com.hospital.repository;

import com.hospital.model.Patient;
import com.hospital.model.PatientStatus;
import com.hospital.model.Ward;
import org.springframework.data.jpa.domain.Specification;

public final class PatientSpecifications {

    private PatientSpecifications() {
    }

    public static Specification<Patient> hasStatus(PatientStatus status) {
        return (root, query, criteriaBuilder) ->
                status == null ? criteriaBuilder.conjunction() : criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Patient> hasWard(Ward ward) {
        return (root, query, criteriaBuilder) ->
                ward == null ? criteriaBuilder.conjunction() : criteriaBuilder.equal(root.get("ward"), ward);
    }

    public static Specification<Patient> nameContains(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            String queryText = "%" + search.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), queryText),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), queryText)
            );
        };
    }
}
