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
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private NaturezaOperacao naturezaOperacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private Pedido pedido;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidade;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal estoqueAposMovimentacao;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dataMovimentacao;
}