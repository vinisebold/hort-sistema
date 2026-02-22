package dev.vinisebold.hort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    private Integer id;

    @Column(nullable = false)
    private String senhaMasterHash;

    private String nomeNegocio;
}