package dev.vinisebold.hort.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoteEntrada {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(nullable = false)
  private ItemPedido itemPedido;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(nullable = false)
  private Produto produto;

  @Column(nullable = false, precision = 10, scale = 3)
  private BigDecimal quantidadeOriginal;

  @Column(nullable = false, precision = 10, scale = 3)
  private BigDecimal quantidadeDisponivel;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal custoUnitario;

  @Column(nullable = false)
  private LocalDateTime dataEntrada;

  @Column(nullable = false)
  private Boolean isEsgotado = false;
}
