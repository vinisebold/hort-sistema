package dev.vinisebold.hort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormaPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false)
    private Boolean exigeCliente = false;

    @Column(nullable = false)
    private Boolean exigeDocumentoReferencia = false;

    @Column(nullable = false)
    private Boolean isActive = true;
}