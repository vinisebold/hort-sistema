package dev.vinisebold.hort.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoteSaida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private LoteEntrada loteEntrada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private ItemPedido itemPedidoVenda; // A venda que consumiu

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidadeConsumida;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal custoUnitario;
}