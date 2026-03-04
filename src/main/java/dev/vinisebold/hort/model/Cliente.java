package dev.vinisebold.hort.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String tipoPessoa;

    @Column(unique = true)
    private String documento;

    @Column(nullable = false)
    private String razaoSocial;

    private String nomeFantasia;

    private String endereco;

    private String contato;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(precision = 10, scale = 2)
    private BigDecimal saldoCredito = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}