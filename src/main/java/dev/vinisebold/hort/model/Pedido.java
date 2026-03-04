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
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private NaturezaOperacao naturezaOperacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private Cliente cliente;

    private String documentoReferencia;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(nullable = true)
    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dataEmissao;
}