package dev.vinisebold.hort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NaturezaOperacao {

    @Id
    private Integer id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false)
    private String tipoMovimento;

    @Column(nullable = false)
    private Boolean geraFinanceiro = true;
}
